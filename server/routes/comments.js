import express from 'express';
import { createComment, getCommentsByPost, deleteComment } from '../controllers/commentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .post(protect, createComment);

router.route('/:postId')
  .get(getCommentsByPost);

router.delete('/:id', protect, deleteComment);

export default router;
