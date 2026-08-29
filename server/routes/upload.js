import express from 'express';
import { upload } from '../middleware/upload.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Upload single or multiple media files
router.post('/', protect, upload.array('files', 10), (req, res) => {
  const uploadedFiles = req.files || (req.file ? [req.file] : []);

  if (!uploadedFiles || uploadedFiles.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }

  const urls = uploadedFiles.map(file => `/api/uploads/${file.filename}`);

  res.status(200).json({
    success: true,
    message: 'Files uploaded successfully',
    urls,
    url: urls[0]
  });
});

export default router;
