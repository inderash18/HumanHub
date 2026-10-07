import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { open, unlink } from 'node:fs/promises';
import { upload } from '../middleware/upload.js';
import { protect, optionalProtect } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { matchesMediaType } from '../utils/mediaSignature.js';
import redis from '../config/redis.js';
import MediaAnalysis from '../models/MediaAnalysis.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');

const router = express.Router();
const QUEUE_KEY = 'media:analysis:queue';

async function computeFileSha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

// Authorized media delivery replacing unrestricted express.static
router.get('/:filename', optionalProtect, asyncHandler(async (req, res) => {
  const { filename } = req.params;

  // Strict filename validation to eliminate directory traversal
  if (!filename || !/^[a-zA-Z0-9_\-\.]+$/.test(filename) || filename.includes('..')) {
    return res.status(400).json({ message: 'Invalid media filename' });
  }

  const filePath = path.join(uploadsDir, filename);

  // Check file existence
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Media not found' });
  }

  // Check if media is blocked or quarantined in MediaAnalysis
  const analysis = await MediaAnalysis.findOne({
    mediaUrl: { $in: [`/api/uploads/${filename}`, `/uploads/${filename}`] }
  }).select('owner processingState publicationDecision').lean();

  if (analysis && (analysis.publicationDecision === 'BLOCKED' || analysis.publicationDecision === 'HELD_FOR_REVIEW')) {
    const isOwner = req.user && String(analysis.owner) === String(req.user._id);
    const isPrivileged = req.user && ['admin', 'moderator'].includes(req.user.role);

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: 'Media is currently not available for public delivery.' });
    }
  }

  // Stream media with high-speed caching headers
  res.setHeader('Content-Security-Policy', "default-src 'none'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
  return fs.createReadStream(filePath).pipe(res);
}));

// Upload handler
router.post('/', protect, upload.any(), asyncHandler(async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (!files.length) return res.status(400).json({ message: 'No files uploaded' });
  
  try {
    for (const file of files) {
      const handle = await open(file.path, 'r');
      try {
        const bytes = Buffer.alloc(16);
        const { bytesRead } = await handle.read(bytes, 0, bytes.length, 0);
        if (!matchesMediaType(bytes.subarray(0, bytesRead), file.mimetype)) {
          throw new Error('Uploaded file content does not match its media type.');
        }
      } finally { await handle.close(); }
    }
  } catch {
    await Promise.allSettled(files.map(file => unlink(file.path)));
    return res.status(400).json({ message: 'Invalid media file. Upload a supported image or video.' });
  }

  const urls = [];
  const mediaIds = [];

  for (const file of files) {
    const mediaUrl = '/api/uploads/' + file.filename;
    urls.push(mediaUrl);

    // If image, automatically create & enqueue MediaAnalysis
    if (file.mimetype.startsWith('image/')) {
      const fileHash = await computeFileSha256(file.path);
      const mediaId = crypto.randomUUID();
      mediaIds.push(mediaId);

      const analysis = await MediaAnalysis.create({
        mediaId,
        mediaVersion: 1,
        owner: req.user._id,
        mediaUrl,
        originalPath: file.path,
        fileHash,
        mimeType: file.mimetype,
        processingState: 'QUEUED',
        analysisOutcome: 'PENDING',
        publicationDecision: 'PENDING',
        decisionReason: 'Checking image before publishing...',
        evidence: {
          badgeLabel: 'Checking image before publishing...',
          badgeVariant: 'neutral',
          primaryExplanation: 'Origin verification in progress.',
          detailedPoints: ['Analyzing media origin and authenticity...'],
          limitations: ['Background processing in progress.']
        }
      });

      try {
        await redis.lpush(QUEUE_KEY, JSON.stringify({
          id: String(analysis._id),
          mediaId,
          mediaVersion: 1
        }));
      } catch {}
    }
  }

  // Trigger worker processing immediately
  setImmediate(() => {
    import('../workers/mediaAnalysisWorker.js')
      .then(m => m.processAnalysisJob())
      .catch(() => {});
  });

  res.status(201).json({ 
    success: true, 
    message: 'Files uploaded', 
    urls, 
    mediaIds,
    url: urls[0],
    fileUrl: urls[0],
    path: urls[0]
  });
}));

export default router;
