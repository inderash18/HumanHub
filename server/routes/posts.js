import express from 'express';
import { 
  createPost, 
  getPosts, 
  getPostById, 
  toggleLikePost, 
  toggleSavePost, 
  getSavedPosts, 
  deletePost 
} from '../controllers/postController.js';
import { protect, optionalProtect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(optionalProtect, getPosts)
  .post(protect, createPost);

router.get('/saved', protect, getSavedPosts);

router.route('/:id')
  .get(optionalProtect, getPostById)
  .delete(protect, deletePost);

router.post('/:id/like', protect, toggleLikePost);
router.post('/:id/save', protect, toggleSavePost);

export default router;
