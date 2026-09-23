import express from 'express';
import { 
  registerUser, 
  verifyOTP, 
  resendOTP, 
  loginUser, 
  getMe, 
  forgotPassword, 
  resetPassword, 
  logoutUser,
  refreshSession,
  verifyMfaLogin,
  setupMfa,
  enableMfa,
  disableMfa,
  getActiveSessions,
  revokeSessionEndpoint,
  revokeOtherSessionsEndpoint
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { requireTrustedOrigin } from '../config/security.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();
router.use(requireTrustedOrigin);

// Public authentication flows
router.post('/register', authLimiter, registerUser);
router.post('/verify-otp', authLimiter, verifyOTP);
router.post('/resend-otp', authLimiter, resendOTP);
router.post('/login', authLimiter, loginUser);
router.post('/mfa/verify-login', authLimiter, verifyMfaLogin);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/refresh', requireTrustedOrigin, refreshSession);
router.post('/logout', requireTrustedOrigin, logoutUser);

// Protected user profile & security flows
router.get('/me', protect, getMe);

// MFA endpoints
router.post('/mfa/setup', protect, setupMfa);
router.post('/mfa/enable', protect, enableMfa);
router.post('/mfa/disable', protect, disableMfa);

// Session management
router.get('/sessions', protect, getActiveSessions);
router.delete('/sessions/:sessionId', protect, revokeSessionEndpoint);
router.post('/sessions/revoke-others', protect, revokeOtherSessionsEndpoint);

export default router;

