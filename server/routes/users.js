import express from 'express';
import { getUserProfile, updateUserProfile, getNotifications } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/me/notifications', protect, getNotifications);
router.put('/me', protect, updateUserProfile);
router.get('/:username', getUserProfile);

export default router;
