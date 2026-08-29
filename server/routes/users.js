import express from 'express';
import { 
  getUserProfile, 
  updateUserProfile, 
  followUser, 
  getUserFollowers, 
  getUserFollowing, 
  getSuggestedUsers, 
  searchUsers 
} from '../controllers/userController.js';
import { protect, optionalProtect } from '../middleware/auth.js';

const router = express.Router();

router.put('/profile', protect, updateUserProfile);
router.get('/profile/:id', optionalProtect, getUserProfile);
router.get('/u/:username', optionalProtect, getUserProfile);
router.get('/suggestions', protect, getSuggestedUsers);
router.get('/search/query', searchUsers);

router.post('/:id/follow', protect, followUser);
router.get('/:id/followers', getUserFollowers);
router.get('/:id/following', getUserFollowing);

export default router;
