import express from 'express';
import { 
  registerUser, 
  verifyOTP, 
  resendOTP, 
  loginUser, 
  getMe, 
  forgotPassword, 
  resetPassword, 
  logoutUser 
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, registerUser);
router.post('/verify-otp', authLimiter, verifyOTP);
router.post('/resend-otp', authLimiter, resendOTP);
router.post('/login', authLimiter, loginUser);
router.get('/me', protect, getMe);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/logout', logoutUser);

export default router;
