import express from 'express';
import { createPost, getPosts, getPostById, deletePost, reportPost } from '../controllers/postController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.route('/')
  .get(getPosts)
  .post(protect, upload.array('media', 3), createPost);

router.route('/:id')
  .get(getPostById)
  .delete(protect, deletePost);

router.post('/:id/report', protect, reportPost);

export default router;
