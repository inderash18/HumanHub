import crypto from 'crypto';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { 
  issueSession, 
  rotateSession, 
  revokeSession, 
  clearCookieOptions,
  listUserSessions,
  revokeSessionById,
  revokeAllUserSessions
} from '../services/sessionService.js';
import { checkOTP } from '../services/otpService.js';
import { getIO } from '../socket/socketHandler.js';
import { sendOTPEmail } from '../utils/mailer.js';
import { 
  hashPassword, 
  verifyPassword, 
  needsRehash,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH 
} from '../utils/passwordHasher.js';
import {
  encryptMfaSecret,
  decryptMfaSecret,
  generateTotpSetup,
  verifyTotpToken,
  generateBackupRecoveryCodes,
  consumeBackupRecoveryCode,
  createPasskeyRegistrationOptions,
  verifyPasskeyRegistration,
  createPasskeyAuthenticationOptions,
  verifyPasskeyAuthentication
} from '../services/mfaService.js';

// Helper to generate a cryptographically secure 6-digit OTP
const generateSecureOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// @desc    Initiate registration (sends 6-digit OTP to email)
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, displayName, bio } = req.body;

  if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string' || 
      password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH || 
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400);
    throw new Error(`Provide a username, valid email, and password of ${MIN_PASSWORD_LENGTH}–${MAX_PASSWORD_LENGTH} characters`);
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');

  if (cleanUsername.length < 3) {
    res.status(400);
    throw new Error('Username must be at least 3 characters and contain only letters, numbers, and underscores');
  }

  // Check if username or email already taken by an active user
  const existingUser = await User.findOne({
    $or: [{ email: cleanEmail }, { username: cleanUsername }]
  });

  if (existingUser) {
    res.status(400);
    throw new Error(existingUser.email === cleanEmail ? 'Email is already registered' : 'Username is already taken');
  }

  // Hash password using Argon2id
  const passwordHash = await hashPassword(password);

  // Generate OTP
  const pending = await OTP.findOne({ email: cleanEmail, type: 'register' });
  if (pending?.lastSentAt && Date.now() - pending.lastSentAt.getTime() < 60000) {
    res.status(429);
    throw new Error('Wait 60 seconds before requesting another code.');
  }

  const rawOTP = generateSecureOTP();
  const otpHash = crypto.createHash('sha256').update(rawOTP).digest('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Upsert OTP record
  await OTP.findOneAndUpdate(
    { email: cleanEmail, type: 'register' },
    {
      email: cleanEmail,
      otpHash,
      failedAttempts: 0,
      type: 'register',
      tempUserData: {
        username: cleanUsername,
        displayName: (displayName || cleanUsername).trim(),
        passwordHash
      },
      expiresAt,
      lastSentAt: new Date()
    },
    { upsert: true, new: true }
  );

  // Send OTP Email
  try {
    await sendOTPEmail(cleanEmail, rawOTP, 'register');
  } catch (emailErr) {
    res.status(503);
    throw new Error('Verification email could not be sent. Please try again shortly.');
  }

  res.status(200).json({
    success: true,
    requiresOTP: true,
    email: cleanEmail,
    message: 'Verification code sent to your email address.'
  });
});

// @desc    Verify OTP and complete registration or action
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp, type = 'register' } = req.body;

  if (!email || !otp) {
    res.status(400);
    throw new Error('Please provide email and verification code');
  }

  const cleanEmail = email.toLowerCase().trim();
  const otpRecord = await checkOTP(cleanEmail, type, otp, type === 'register');
  if (!otpRecord) {
    res.status(400);
    throw new Error('Invalid, expired, or exhausted verification code. Request a new code.');
  }

  if (type === 'register') {
    const { username, displayName, passwordHash } = otpRecord.tempUserData;

    // Double check availability
    const existing = await User.findOne({ $or: [{ email: cleanEmail }, { username }] });
    if (existing) {
      res.status(409);
      throw new Error('Email or username is already registered. Please sign in or choose another username.');
    }
    const user = await User.create({
      username,
      displayName: displayName || username,
      email: cleanEmail,
      passwordHash,
      emailVerified: true
    });
    const token = await issueSession(user, res);

    const userObj = {
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      postsCount: user.postsCount
    };

    return res.status(201).json({
      success: true,
      user: userObj,
      token,
      message: 'Account verified successfully! Welcome to HumanHub.'
    });
  }

  if (type === 'forgot_password') {
    return res.status(200).json({
      success: true,
      message: 'Code verified. You can now reset your password.'
    });
  }
});

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOTP = asyncHandler(async (req, res) => {
  const { email, type = 'register' } = req.body;
  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const cleanEmail = email.toLowerCase().trim();
  const existingOTP = await OTP.findOne({ email: cleanEmail, type });

  if (!existingOTP) {
    res.status(400);
    throw new Error('No pending request found for this email. Please sign up or reset password.');
  }

  // 60-second cooldown check
  const now = Date.now();
  const cooldown = 60 * 1000;
  if (existingOTP.lastSentAt && (now - new Date(existingOTP.lastSentAt).getTime()) < cooldown) {
    const remainingSecs = Math.ceil((cooldown - (now - new Date(existingOTP.lastSentAt).getTime())) / 1000);
    res.status(429);
    throw new Error(`Please wait ${remainingSecs} seconds before requesting another code.`);
  }

  const rawOTP = generateSecureOTP();
  const otpHash = crypto.createHash('sha256').update(rawOTP).digest('hex');

  existingOTP.otpHash = otpHash;
  existingOTP.failedAttempts = 0;
  existingOTP.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  existingOTP.lastSentAt = new Date();
  existingOTP.resendAttempts = (existingOTP.resendAttempts || 0) + 1;
  await existingOTP.save();

  await sendOTPEmail(cleanEmail, rawOTP, type);

  res.status(200).json({
    success: true,
    message: 'A new verification code has been dispatched to your email.'
  });
});

// @desc    Authenticate user & get token (with transparent Argon2id migration & MFA check)
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  const identifier = email || username;

  if (typeof identifier !== 'string' || typeof password !== 'string' || !identifier || !password) {
    res.status(400);
    throw new Error('Please provide email/username and password');
  }

  const trimmedIdentifier = identifier.trim();
  const user = await User.findOne({
    $or: [
      { email: trimmedIdentifier.toLowerCase() },
      { username: trimmedIdentifier.toLowerCase() }
    ]
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401);
    throw new Error('Invalid email/username or password');
  }

  if (user.isBanned || !user.emailVerified) {
    res.status(403);
    throw new Error('Account is suspended or email verification is required.');
  }

  // Transparent Password Migration to Argon2id
  if (needsRehash(user.passwordHash)) {
    try {
      user.passwordHash = await hashPassword(password);
      user.passwordVersion = (user.passwordVersion || 1) + 1;
      await user.save();
    } catch (e) {
      console.warn('[Auth] Transparent password upgrade deferred:', e.message);
    }
  }

  // Check if MFA is enabled on user account
  if (user.mfa?.enabled) {
    // Generate short-lived temporary challenge token
    const challengeId = crypto.randomBytes(32).toString('hex');
    user.mfa.pendingChallenge = challengeId;
    await user.save();

    return res.status(200).json({
      success: true,
      requiresMFA: true,
      mfaType: 'totp',
      challengeId,
      message: 'MFA verification required to complete login.'
    });
  }

  const token = await issueSession(user, res);

  const userObj = {
    _id: user._id,
    username: user.username,
    displayName: user.displayName || user.username,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    role: user.role,
    followersCount: user.followersCount || 0,
    followingCount: user.followingCount || 0,
    postsCount: user.postsCount || 0,
    mfaEnabled: Boolean(user.mfa?.enabled)
  };

  res.json({
    success: true,
    user: userObj,
    token,
    ...userObj
  });
});

// @desc    Complete login with MFA TOTP or Backup Code
// @route   POST /api/auth/mfa/verify-login
// @access  Public
export const verifyMfaLogin = asyncHandler(async (req, res) => {
  const { challengeId, code, isBackupCode } = req.body;

  if (!challengeId || !code) {
    res.status(400);
    throw new Error('Please provide challenge ID and verification code.');
  }

  const user = await User.findOne({ 'mfa.pendingChallenge': challengeId });
  if (!user || !user.mfa?.enabled) {
    res.status(401);
    throw new Error('Invalid or expired MFA session.');
  }

  if (isBackupCode) {
    const result = consumeBackupRecoveryCode(code, user.mfa.backupCodes || []);
    if (!result.valid) {
      res.status(400);
      throw new Error('Invalid or already used backup recovery code.');
    }
    user.markModified('mfa.backupCodes');
  } else {
    // Decrypt TOTP secret
    const secret = decryptMfaSecret(user.mfa.secretEncrypted);
    const result = verifyTotpToken(code, secret, user.mfa.lastUsedTimestep);
    if (!result.verified) {
      res.status(400);
      throw new Error(result.reason || 'Invalid TOTP verification code.');
    }
    user.mfa.lastUsedTimestep = result.timestep;
  }

  // Clear challenge
  user.mfa.pendingChallenge = null;
  await user.save();

  const token = await issueSession(user, res);

  const userObj = {
    _id: user._id,
    username: user.username,
    displayName: user.displayName || user.username,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    role: user.role,
    followersCount: user.followersCount || 0,
    followingCount: user.followingCount || 0,
    postsCount: user.postsCount || 0,
    mfaEnabled: true
  };

  res.json({
    success: true,
    user: userObj,
    token,
    ...userObj
  });
});

// @desc    Setup MFA TOTP
// @route   POST /api/auth/mfa/setup
// @access  Private
export const setupMfa = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { secret, otpauthUrl } = generateTotpSetup(user.username, 'HumanHub');
  const encrypted = encryptMfaSecret(secret);

  user.mfa = {
    ...user.mfa,
    secretEncrypted: encrypted
  };
  await user.save();

  res.json({
    success: true,
    secret,
    otpauthUrl,
    message: 'Scan the QR code or enter the secret in your authenticator app.'
  });
});

// @desc    Confirm & Enable MFA
// @route   POST /api/auth/mfa/enable
// @access  Private
export const enableMfa = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) {
    res.status(400);
    throw new Error('Verification code is required');
  }

  const user = await User.findById(req.user._id);
  if (!user || !user.mfa?.secretEncrypted) {
    res.status(400);
    throw new Error('MFA setup not initialized. Run setup first.');
  }

  const secret = decryptMfaSecret(user.mfa.secretEncrypted);
  const result = verifyTotpToken(code, secret);
  if (!result.verified) {
    res.status(400);
    throw new Error('Invalid verification code.');
  }

  const { plainCodes, hashedCodes } = generateBackupRecoveryCodes(10);
  user.mfa.enabled = true;
  user.mfa.backupCodes = hashedCodes;
  user.mfa.lastUsedTimestep = result.timestep;
  await user.save();

  res.json({
    success: true,
    backupCodes: plainCodes,
    message: 'MFA enabled successfully. Store your backup recovery codes securely.'
  });
});

// @desc    Disable MFA
// @route   POST /api/auth/mfa/disable
// @access  Private
export const disableMfa = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password) {
    res.status(400);
    throw new Error('Password required to disable MFA');
  }

  const user = await User.findById(req.user._id);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401);
    throw new Error('Invalid password confirmation.');
  }

  user.mfa.enabled = false;
  user.mfa.secretEncrypted = null;
  user.mfa.backupCodes = [];
  await user.save();

  res.json({ success: true, message: 'MFA has been disabled.' });
});

// @desc    Get currently logged in user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-passwordHash');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.status(200).json({
    success: true,
    user: {
      _id: user._id,
      username: user.username,
      displayName: user.displayName || user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      followersCount: user.followersCount || 0,
      followingCount: user.followingCount || 0,
      postsCount: user.postsCount || 0,
      mfaEnabled: Boolean(user.mfa?.enabled)
    }
  });
});

// @desc    Initiate forgot password (sends OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error('Please enter your email address');
  }

  const cleanEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: cleanEmail });

  if (user) {
    const rawOTP = generateSecureOTP();
    const otpHash = crypto.createHash('sha256').update(rawOTP).digest('hex');

    await OTP.findOneAndUpdate(
      { email: cleanEmail, type: 'forgot_password' },
      {
        email: cleanEmail,
        otpHash,
        failedAttempts: 0,
        type: 'forgot_password',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        lastSentAt: new Date()
      },
      { upsert: true }
    );

    await sendOTPEmail(cleanEmail, rawOTP, 'forgot_password');
  }

  // Always return generic success to prevent email enumeration attacks
  res.status(200).json({
    success: true,
    message: 'If an account matches this email, a 6-digit password reset code has been sent.'
  });
});

// @desc    Reset password using verified OTP
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    res.status(400);
    throw new Error('Please provide email, verification code, and new password');
  }

  if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > MAX_PASSWORD_LENGTH) {
    res.status(400);
    throw new Error(`New password must be ${MIN_PASSWORD_LENGTH}–${MAX_PASSWORD_LENGTH} characters`);
  }

  const cleanEmail = email.toLowerCase().trim();
  const otpRecord = await checkOTP(cleanEmail, 'forgot_password', otp, true);
  if (!otpRecord) {
    res.status(400);
    throw new Error('Invalid, expired, or exhausted verification code.');
  }

  const user = await User.findOne({ email: cleanEmail });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.passwordHash = await hashPassword(newPassword);
  user.passwordVersion = (user.passwordVersion || 1) + 1;
  user.lastPasswordChange = new Date();
  await user.save();

  // Revoke all active sessions upon password reset
  await Session.updateMany({ user: user._id }, { $set: { revokedAt: new Date() } });
  getIO()?.in('user_' + user._id).disconnectSockets(true);

  await OTP.deleteOne({ _id: otpRecord._id });

  res.status(200).json({
    success: true,
    message: 'Your password has been reset successfully. You can now log in.'
  });
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = asyncHandler(async (req, res) => {
  const sessions = await revokeSession(req);
  for (const id of sessions) getIO()?.in('session_' + id).disconnectSockets(true);
  res.clearCookie('refreshToken', clearCookieOptions());
  res.clearCookie('refreshToken', { ...clearCookieOptions(), path: '/' });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export const refreshSession = asyncHandler(async (req, res) => {
  const result = await rotateSession(req, res);
  if (!result) {
    res.clearCookie('refreshToken', clearCookieOptions());
    return res.status(401).json({ success: false, message: 'Please sign in again.' });
  }
  res.json({ success: true, ...result });
});

// @desc    Get all active sessions for current user
// @route   GET /api/auth/sessions
// @access  Private
export const getActiveSessions = asyncHandler(async (req, res) => {
  const currentSessionId = req.session?._id;
  const sessions = await listUserSessions(req.user._id, currentSessionId);
  res.json({ success: true, sessions });
});

// @desc    Revoke a specific session
// @route   DELETE /api/auth/sessions/:sessionId
// @access  Private
export const revokeSessionEndpoint = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  if (!sessionId) {
    res.status(400);
    throw new Error('Session ID is required');
  }

  const success = await revokeSessionById(req.user._id, sessionId);
  if (!success) {
    res.status(404);
    throw new Error('Session not found or already revoked');
  }

  getIO()?.in('session_' + sessionId).disconnectSockets(true);
  res.json({ success: true, message: 'Session revoked successfully' });
});

// @desc    Revoke all other active sessions except current
// @route   POST /api/auth/sessions/revoke-others
// @access  Private
export const revokeOtherSessionsEndpoint = asyncHandler(async (req, res) => {
  const currentSessionId = req.session?._id;
  const count = await revokeAllUserSessions(req.user._id, currentSessionId);
  res.json({ success: true, message: `Revoked ${count} other active sessions.` });
});
