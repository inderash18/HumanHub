import express from 'express';
import { getNotifications, markAllRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.post('/read-all', markAllRead);

export default router;
