import express from 'express';
import { getUserProfile, updateUserProfile, deleteUser, getSuggestedUsers, followUser, searchUsers } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/search/query', protect, searchUsers);
router.get('/suggested/list', protect, getSuggestedUsers);
router.put('/me', protect, updateUserProfile);
router.delete('/me', protect, deleteUser);
router.post('/:id/follow', protect, followUser);
router.get('/:id', getUserProfile);

export default router;


