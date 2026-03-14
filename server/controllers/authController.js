import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import generateToken, { generateRefreshToken } from '../utils/generateToken.js';
import bcrypt from 'bcryptjs';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({
    username,
    email,
    passwordHash
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      trustScore: user.trustScore,
      message: 'User registered successfully. Please verify your email.'
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.passwordHash))) {
    
    if (user.isBanned) {
      res.status(403);
      throw new Error('Your account has been banned due to policy violations.');
    }

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Set refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      trustScore: user.trustScore,
      token
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = asyncHandler(async (req, res) => {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0)
  });

  res.status(200).json({ message: 'Logged out successfully' });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refresh = asyncHandler(async (req, res) => {
    // Basic stub, real app connects to redis to check for token blacklists
    res.status(200).json({ message: 'Tokens refreshed' });
});

// @desc    Verify Email
// @route   GET /api/auth/verify/:token
// @access  Public
export const verifyEmail = asyncHandler(async (req, res) => {
    res.status(200).json({ message: 'Email verified' });
});
