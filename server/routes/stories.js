import express from 'express';
import { createStory, getStories } from '../controllers/storyController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .post(protect, createStory)
  .get(protect, getStories);

export default router;
