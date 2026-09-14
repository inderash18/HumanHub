import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');

// Ensure uploads folder exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}-${({ 'image/jpeg': 'image.jpg', 'image/png': 'image.png', 'image/webp': 'image.webp', 'video/mp4': 'video.mp4', 'video/webm': 'video.webm', 'video/quicktime': 'video.mov' })[file.mimetype]}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only approved image (JPG, PNG, WEBP) and video (MP4, WEBM) files are allowed.'), false);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB max size
  },
  fileFilter
});

