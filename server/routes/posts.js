import express from 'express';
import { 
  createPost, 
  getPosts, 
  getPostById, 
  deletePost, 
  reportPost, 
  toggleSavePost, 
  getSavedPosts 
} from '../controllers/postController.js';
import { handleVote } from '../controllers/voteController.js';
import { protect, optionalProtect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.route('/')
  .get(optionalProtect, getPosts)
  .post(protect, upload.array('media', 3), createPost);

router.get('/saved', protect, getSavedPosts);
router.post('/:id/save', protect, toggleSavePost);
router.post('/:id/vote', protect, handleVote);
router.post('/:id/report', protect, reportPost);

router.route('/:id')
  .get(optionalProtect, getPostById)
  .delete(protect, deletePost);

export default router;



