import express from 'express';
import { 
  getUserProfile, 
  updateUserProfile, 
  deleteUser, 
  getSuggestedUsers, 
  followUser, 
  searchUsers,
  getUserFollowers,
  getUserFollowing,
  uploadAvatar
} from '../controllers/userController.js';
import { protect, optionalProtect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.get('/search/query', protect, searchUsers);
router.get('/suggested/list', protect, getSuggestedUsers);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.put('/me', protect, updateUserProfile);
router.delete('/me', protect, deleteUser);
router.post('/:id/follow', protect, followUser);
router.get('/:id/followers', protect, getUserFollowers);
router.get('/:id/following', protect, getUserFollowing);
router.get('/:id', optionalProtect, getUserProfile);

export default router;



