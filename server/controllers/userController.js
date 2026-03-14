import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import Post from '../models/Post.js';

// @desc    Get user profile 
// @route   GET /api/users/:username
// @access  Public
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username })
    .select('-passwordHash -email'); // Don't expose private info

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Fetch their verified posts
  const posts = await Post.find({ author: user._id, status: 'published' })
    .populate('community', 'name slug')
    .sort({ createdAt: -1 })
    .limit(10);

  res.json({
    profile: user,
    posts
  });
});

// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
    // Boilerplate for bio / avatar updates
    res.status(200).json({ message: "Profile updated" });
});

// @desc    Get notifications
// @route   GET /api/users/me/notifications
// @access  Private
export const getNotifications = asyncHandler(async (req, res) => {
    // Boilerplate mapping to Notification models usually accessed from sockets directly
    res.status(200).json([]);
});
