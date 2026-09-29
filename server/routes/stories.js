import express from 'express';
import {
  createStory,
  getStories,
  getMyStories,
  getUserStories,
  deleteStory,
  recordStoryView,
  reactToStory,
  replyToStory
} from '../controllers/storyController.js';
import { protect, optionalProtect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .post(protect, createStory)
  .get(optionalProtect, getStories);

router.get('/my', protect, getMyStories);
router.get('/user/:userId', optionalProtect, getUserStories);

router.route('/:id')
  .delete(protect, deleteStory);

router.post('/:id/view', optionalProtect, recordStoryView);
router.post('/:id/react', protect, reactToStory);
router.post('/:id/reply', protect, replyToStory);

export default router;
