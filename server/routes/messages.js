import express from 'express';
import { sendMessage, getMessages, getConversations } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', sendMessage);
router.get('/conversations', getConversations);
router.get('/conversations/active', getConversations);
router.get('/:userId', getMessages);

export default router;
