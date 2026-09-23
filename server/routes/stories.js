import express from 'express';
import { createStory, getStories } from '../controllers/storyController.js';
import { protect, optionalProtect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .post(protect, createStory)
  .get(optionalProtect, getStories);

export default router;
