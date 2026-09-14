import express from 'express';
import { open, unlink } from 'node:fs/promises';
import { upload } from '../middleware/upload.js';
import { protect } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { matchesMediaType } from '../utils/mediaSignature.js';

const router = express.Router();
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
