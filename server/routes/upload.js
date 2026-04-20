import express from 'express';
import { upload } from '../middleware/upload.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Support multiple images (Reddit gallery style)
router.post('/', protect, upload.array('images', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }

  // Calculate URLs based on server address
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  const urls = req.files.map(file => `${baseUrl}/uploads/${file.filename}`);

  res.status(200).json({
    message: 'Files uploaded successfully',
    urls: urls
  });
});

export default router;

