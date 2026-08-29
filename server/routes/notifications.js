import express from 'express';
import { 
  getNotifications, 
  getUnreadCount, 
  markNotificationRead, 
  markAllRead 
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllRead);
router.post('/read-all', markAllRead);
router.put('/:id/read', markNotificationRead);

export default router;
