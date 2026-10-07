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
import { uploadToCloudinary, isCloudinaryActive } from '../config/cloudinary.js';

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

// Authorized media delivery replacing unrestricted express.static (for local dev fallback)
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

// Upload handler supporting posts, stories, avatars, and general media
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

  // Determine target Cloudinary folder based on request hints
  const rawFolder = (req.query.folder || req.body.folder || 'posts').toLowerCase();
  let targetFolder = 'humanhub/posts';
  if (rawFolder === 'avatar' || rawFolder === 'avatars') {
    targetFolder = 'humanhub/avatars';
  } else if (rawFolder === 'story' || rawFolder === 'stories') {
    targetFolder = 'humanhub/stories';
  }

  const mediaList = [];
  const urls = [];
  const mediaIds = [];

  for (const file of files) {
    let mediaObj = {
      url: '/api/uploads/' + file.filename,
      secure_url: '/api/uploads/' + file.filename,
      publicId: '',
      public_id: '',
      provider: 'local',
      resourceType: file.mimetype.startsWith('video/') ? 'video' : 'image',
      format: path.extname(file.originalname).replace('.', '') || 'jpg',
      bytes: file.size || 0,
      width: 0,
      height: 0
    };

    if (isCloudinaryActive()) {
      try {
        const cloudRes = await uploadToCloudinary(file.path, {
          folder: targetFolder,
          resource_type: 'auto'
        });
        if (cloudRes && cloudRes.secure_url) {
          mediaObj = cloudRes;
        }
      } catch (cloudErr) {
        console.warn('[Upload] Cloudinary upload deferred/failed, using local fallback:', cloudErr.message);
      }
    }

    mediaList.push(mediaObj);
    urls.push(mediaObj.url);

    // If image, automatically create & enqueue MediaAnalysis
    if (file.mimetype.startsWith('image/')) {
      const fileHash = await computeFileSha256(file.path);
      const mediaId = crypto.randomUUID();
      mediaIds.push(mediaId);

      const analysis = await MediaAnalysis.create({
        mediaId,
        mediaVersion: 1,
        owner: req.user._id,
        mediaUrl: mediaObj.url,
        originalPath: file.path,
        cloudinaryPublicId: mediaObj.publicId || '',
        fileHash,
        mimeType: file.mimetype,
        dimensions: {
          width: mediaObj.width || 0,
          height: mediaObj.height || 0
        },
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

      if (redis) {
        try {
          await redis.lpush(QUEUE_KEY, JSON.stringify({
            id: String(analysis._id),
            mediaId,
            mediaVersion: 1
          }));
        } catch {}
      }
    }

    // In production with Cloudinary, cleanup local disk file
    if (isCloudinaryActive() && process.env.NODE_ENV === 'production') {
      unlink(file.path).catch(() => {});
    }
  }

  // Trigger worker processing immediately
  setImmediate(() => {
    import('../workers/mediaAnalysisWorker.js')
      .then(m => m.processAnalysisJob())
      .catch(() => {});
  });

  const primaryMedia = mediaList[0] || {};

  res.status(201).json({ 
    success: true, 
    message: 'Files uploaded successfully', 
    media: mediaList,
    urls, 
    mediaIds,
    url: primaryMedia.url,
    secure_url: primaryMedia.url,
    public_id: primaryMedia.publicId,
    publicId: primaryMedia.publicId,
    resource_type: primaryMedia.resourceType,
    resourceType: primaryMedia.resourceType,
    format: primaryMedia.format,
    bytes: primaryMedia.bytes,
    width: primaryMedia.width,
    height: primaryMedia.height,
    fileUrl: primaryMedia.url,
    path: primaryMedia.url
  });
}));

export default router;

