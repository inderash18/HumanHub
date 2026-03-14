import express from 'express';
import { registerUser, loginUser, logoutUser, refresh, verifyEmail } from '../controllers/authController.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/logout', logoutUser);
router.post('/refresh', refresh);
router.get('/verify/:token', verifyEmail);

export default router;
