import express from 'express';
import { getQueue, approveItem, rejectItem, banUser, getStats } from '../controllers/moderationController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';

const router = express.Router();

// Only Moderators or Admins can access anything here
router.use(protect, authorize('moderator', 'admin'));

router.get('/queue', getQueue);
router.post('/:id/approve', approveItem);
router.post('/:id/reject', rejectItem);
router.post('/ban/:userId', banUser);
router.get('/audit', getStats);
router.get('/stats', getStats);

export default router;
