import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import { createNotification } from './notificationController.js';

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

// @desc    Get suggested verified human users
// @route   GET /api/users/suggested
// @access  Private
export const getSuggestedUsers = asyncHandler(async (req, res) => {
  const suggestions = await User.find({
    _id: { $ne: req.user._id },
    trustScore: { $gte: 0.7 }
  })
  .select('username avatar trustScore bio followers')
  .limit(5);

  res.json(suggestions);
});

// @desc    Follow / Unfollow user
// @route   POST /api/users/:id/follow
// @access  Private
export const followUser = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  const currentUserId = req.user._id;

  if (targetId === currentUserId.toString()) {
    res.status(400);
    throw new Error('You cannot follow yourself');
  }

  const targetUser = await User.findById(targetId);
  const currentUser = await User.findById(currentUserId);

  if (!targetUser) {
    res.status(404);
    throw new Error('Target user not found');
  }

  // Ensure arrays are initialized
  if (!currentUser.following) currentUser.following = [];
  if (!targetUser.followers) targetUser.followers = [];

  const isFollowing = currentUser.following.includes(targetId);

  if (isFollowing) {
    currentUser.following = currentUser.following.filter(id => id.toString() !== targetId);
    targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId.toString());
  } else {
    currentUser.following.push(targetId);
    targetUser.followers.push(currentUserId);
    
    // Dispatch follow notification
    await createNotification({
      recipient: targetId,
      sender: currentUserId,
      type: 'follow',
      body: `@${currentUser.username} started following you.`
    });
  }

  await currentUser.save();
  await targetUser.save();

  res.json({ 
    success: true, 
    isFollowing: !isFollowing,
    followersCount: targetUser.followers.length,
    followingCount: currentUser.following.length
  });
});

// @desc    Search users by username
// @route   GET /api/users/search/query
// @access  Private
export const searchUsers = asyncHandler(async (req, res) => {
  const query = req.query.q || '';
  if (!query.trim()) return res.json([]);
  
  const results = await User.find({
    username: { $regex: query, $options: 'i' }
  })
  .select('username avatar trustScore bio')
  .limit(8);

  res.json(results);
});




