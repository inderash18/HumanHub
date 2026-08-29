import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import generateToken, { generateRefreshToken } from '../utils/generateToken.js';
import { sendOTPEmail } from '../utils/mailer.js';

// Helper to generate a cryptographically secure 6-digit OTP
const generateSecureOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// @desc    Initiate registration (sends 6-digit OTP to email)
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, displayName, bio } = req.body;

  if (!username || !email || !password) {
    res.status(400);
    throw new Error('Please provide username, email, and password');
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

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Generate OTP
  const rawOTP = generateSecureOTP();
  const otpSalt = await bcrypt.genSalt(8);
  const otpHash = await bcrypt.hash(rawOTP, otpSalt);

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Upsert OTP record
  await OTP.findOneAndUpdate(
    { email: cleanEmail, type: 'register' },
    {
      email: cleanEmail,
      otpHash,
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
    console.error('Failed to send verification email:', emailErr);
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
  const otpRecord = await OTP.findOne({ email: cleanEmail, type });

  if (!otpRecord) {
    res.status(400);
    throw new Error('Verification code has expired or was not requested. Please request a new one.');
  }

  const isMatch = await bcrypt.compare(otp.toString().trim(), otpRecord.otpHash);
  if (!isMatch) {
    res.status(400);
    throw new Error('Invalid verification code. Please try again.');
  }

  if (type === 'register') {
    const { username, displayName, passwordHash } = otpRecord.tempUserData;

    // Double check availability
    const existing = await User.findOne({ $or: [{ email: cleanEmail }, { username }] });
    let user;

    if (existing) {
      existing.emailVerified = true;
      existing.displayName = displayName || existing.displayName;
      user = await existing.save();
    } else {
      user = await User.create({
        username,
        displayName: displayName || username,
        email: cleanEmail,
        passwordHash,
        emailVerified: true
      });
    }

    // Delete OTP record after successful verification
    await OTP.deleteOne({ _id: otpRecord._id });

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

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
  const otpSalt = await bcrypt.genSalt(8);
  const otpHash = await bcrypt.hash(rawOTP, otpSalt);

  existingOTP.otpHash = otpHash;
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

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  const identifier = email || username;

  if (!identifier || !password) {
    res.status(400);
    throw new Error('Please provide email/username and password');
  }

  const trimmedIdentifier = identifier.trim();
  const user = await User.findOne({
    $or: [
      { email: trimmedIdentifier.toLowerCase() },
      { username: new RegExp(`^${trimmedIdentifier}$`, 'i') }
    ]
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401);
    throw new Error('Invalid email/username or password');
  }

  if (user.isBanned) {
    res.status(403);
    throw new Error('This account has been suspended.');
  }

  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

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
    postsCount: user.postsCount || 0
  };

  res.json({
    success: true,
    user: userObj,
    token,
    ...userObj
  });
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
      postsCount: user.postsCount || 0
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
    const otpSalt = await bcrypt.genSalt(8);
    const otpHash = await bcrypt.hash(rawOTP, otpSalt);

    await OTP.findOneAndUpdate(
      { email: cleanEmail, type: 'forgot_password' },
      {
        email: cleanEmail,
        otpHash,
        type: 'forgot_password',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        lastSentAt: new Date()
      },
      { upsert: true }
    );

    await sendOTPEmail(cleanEmail, rawOTP, 'forgot_password');
  }

  // Always return success to prevent email enumeration attacks
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

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters');
  }

  const cleanEmail = email.toLowerCase().trim();
  const otpRecord = await OTP.findOne({ email: cleanEmail, type: 'forgot_password' });

  if (!otpRecord) {
    res.status(400);
    throw new Error('Password reset code has expired. Please request a new one.');
  }

  const isMatch = await bcrypt.compare(otp.toString().trim(), otpRecord.otpHash);
  if (!isMatch) {
    res.status(400);
    throw new Error('Invalid verification code');
  }

  const user = await User.findOne({ email: cleanEmail });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  await user.save();

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
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0)
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
});
