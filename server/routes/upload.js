import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { open, unlink } from 'node:fs/promises';
import { upload } from '../middleware/upload.js';
import { protect, optionalProtect } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { matchesMediaType } from '../utils/mediaSignature.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Follow from '../models/Follow.js';
import Block from '../models/Block.js';
import MediaAnalysis from '../models/MediaAnalysis.js';
import { canViewPost } from '../policies/authorization.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');

const router = express.Router();

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

  // 1. Check if it's an avatar (publicly accessible)
  const isAvatar = await User.exists({ avatar: { $regex: filename } });
  if (isAvatar) {
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return fs.createReadStream(filePath).pipe(res);
  }

  // 2. Check if it belongs to a post
  const post = await Post.findOne({ mediaUrls: { $regex: filename } }).populate('author', 'username privacySettings');
  if (post) {
    let isFollowing = false;
    let isBlocked = false;

    if (req.user) {
      if (post.author) {
        [isFollowing, isBlocked] = await Promise.all([
          Follow.exists({ follower: req.user._id, following: post.author._id }),
          Block.isBlocked(req.user._id, post.author._id)
        ]);
      }
    }

    const authorized = canViewPost({
      user: req.user,
      post,
      isFollowing: Boolean(isFollowing),
      isBlocked: Boolean(isBlocked)
    });

    if (!authorized) {
      return res.status(403).json({ message: 'Access denied to private media.' });
    }

    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', post.author?.privacySettings?.isPrivate ? 'private, no-cache' : 'public, max-age=3600');
    return fs.createReadStream(filePath).pipe(res);
  }

  // 3. Check if it's in MediaAnalysis (e.g. freshly uploaded or in quarantine)
  const analysis = await MediaAnalysis.findOne({
    $or: [{ mediaUrl: { $regex: filename } }, { storagePath: { $regex: filename } }]
  });

  if (analysis) {
    const isOwner = req.user && String(analysis.uploader) === String(req.user._id);
    const isPrivileged = req.user && ['admin', 'moderator'].includes(req.user.role);

    if (isOwner || isPrivileged) {
      res.setHeader('Content-Security-Policy', "default-src 'none'");
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, no-cache');
      return fs.createReadStream(filePath).pipe(res);
    }
  }

  // If unattached, allow owner or privileged users only if authenticated
  if (req.user) {
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-cache');
    return fs.createReadStream(filePath).pipe(res);
  }

  return res.status(403).json({ message: 'Authentication required for media access' });
}));

// Upload handler
router.post('/', protect, upload.array('files', 10), asyncHandler(async (req, res) => {
  const files = req.files || [];
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
  const urls = files.map(file => '/api/uploads/' + file.filename);
  res.status(201).json({ success: true, message: 'Files uploaded', urls, url: urls[0] });
}));

export default router;
