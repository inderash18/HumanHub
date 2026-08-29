import express from 'express';
import { 
  sendMessage, 
  getMessages, 
  getConversations, 
  getUnreadMessagesCount 
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', sendMessage);
router.post('/send', sendMessage);
router.get('/conversations', getConversations);
router.get('/unread-count', getUnreadMessagesCount);
router.get('/:userId', getMessages);

export default router;
