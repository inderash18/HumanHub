import express from 'express';
import { getUserProfile, updateUserProfile, deleteUser } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.put('/me', protect, updateUserProfile);
router.delete('/me', protect, deleteUser);
router.get('/:id', getUserProfile);

export default router;


