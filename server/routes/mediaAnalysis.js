import express from 'express';
import { upload } from '../middleware/upload.js';
import { protect, optionalProtect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import {
  uploadMediaAndEnqueueAnalysis,
  getMediaAnalysis,
  retryMediaAnalysis,
  requestMediaReview,
  getReviewQueue,
  resolveMediaReview
} from '../controllers/mediaAnalysisController.js';

const router = express.Router();

// Upload single image & enqueue for provenance analysis
router.post('/uploads', protect, upload.single('file'), uploadMediaAndEnqueueAnalysis);

// Public / Authenticated analysis inquiry
router.get('/:mediaId/analysis', optionalProtect, getMediaAnalysis);

// Retry analysis (Owner/Moderator)
router.post('/:mediaId/analysis/retry', protect, retryMediaAnalysis);

// Dispute / Review Request
router.post('/:mediaId/analysis/review-request', protect, requestMediaReview);

// Moderator queue endpoints
router.get('/reviews/queue', protect, authorize('moderator', 'admin'), getReviewQueue);
router.post('/reviews/:id/decide', protect, authorize('moderator', 'admin'), resolveMediaReview);

export default router;
