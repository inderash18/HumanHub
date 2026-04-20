import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import Post from '../models/Post.js';

// @desc    Get user profile by ID or username
// @route   GET /api/users/:id
// @access  Public
export const getUserProfile = asyncHandler(async (req, res) => {
  const identifier = req.params.id;
  const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);

  const user = await (isObjectId 
    ? User.findById(identifier) 
    : User.findOne({ username: identifier }))
    .select('-passwordHash -email');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const posts = await Post.find({ author: user._id, status: 'published' })
    .populate('community', 'name slug')
    .sort({ createdAt: -1 })
    .limit(10);

  res.json({ profile: user, posts });
});

// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    user.bio = req.body.bio || user.bio;
    user.avatar = req.body.avatar || user.avatar;

    const updatedUser = await user.save();
    res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
        trustScore: updatedUser.trustScore
    });
});

// @desc    Delete user account
// @route   DELETE /api/users/me
// @access  Private
export const deleteUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    console.log(`[Identity Purge] Initiating for User: ${userId}`);

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
        res.status(404);
        throw new Error('Identity not found in database');
    }

    // Clear refresh token cookies to prevent accidental re-discovery
    res.cookie('refreshToken', '', {
        httpOnly: true,
        expires: new Date(0)
    });

    console.log(`[Identity Purge] Successfully removed: ${userId}`);
    res.json({ message: 'User account permanently purged from HumanHub' });
});


