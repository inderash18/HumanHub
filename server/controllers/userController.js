import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Follow from '../models/Follow.js';
import Block from '../models/Block.js';
import Like from '../models/Like.js';
import SavedPost from '../models/SavedPost.js';
import Notification from '../models/Notification.js';
import { canViewPost, canFollow } from '../policies/authorization.js';

// Escape regex special characters
const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Get user profile by username or ID
// @route   GET /api/users/profile/:id
// @access  Public (Optional Auth)
export const getUserProfile = asyncHandler(async (req, res) => {
  const identifier = req.params.id || req.params.username;
  const isObjectId = mongoose.Types.ObjectId.isValid(identifier);

  const user = await (isObjectId 
    ? User.findById(identifier) 
    : User.findOne({ username: identifier.toLowerCase().trim() }))
    .select('-passwordHash');

  if (!user || user.isBanned) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check bidirectional block if logged in
  let isBlocked = false;
  if (req.user) {
    isBlocked = Boolean(await Block.isBlocked(req.user._id, user._id));
  }

  if (isBlocked && req.user?.role !== 'admin' && req.user?.role !== 'moderator') {
    res.status(404);
    throw new Error('User not found');
  }

  const isSelf = req.user ? req.user._id.toString() === user._id.toString() : false;
  const isFollowing = req.user && !isSelf
    ? Boolean(await Follow.exists({ follower: req.user._id, following: user._id }))
    : false;

  const isPrivate = Boolean(user.privacySettings?.isPrivate);
  const canSeePosts = isSelf || !isPrivate || isFollowing || ['admin', 'moderator'].includes(req.user?.role);

  let formattedPosts = [];
  let totalPosts = 0;

  if (canSeePosts) {
    const [posts, count] = await Promise.all([
      Post.find({ author: user._id, status: 'published' })
        .populate('community', 'name slug icon')
        .sort({ createdAt: -1 })
        .limit(30),
      Post.countDocuments({ author: user._id, status: 'published' })
    ]);
    totalPosts = count;

    let likedPostIds = new Set();
    let savedPostIds = new Set();

    if (req.user && posts.length > 0) {
      const postIds = posts.map(p => p._id);
      const [likes, saves] = await Promise.all([
        Like.find({ user: req.user._id, post: { $in: postIds } }),
        SavedPost.find({ user: req.user._id, post: { $in: postIds } })
      ]);
      likes.forEach(l => likedPostIds.add(l.post.toString()));
      saves.forEach(s => savedPostIds.add(s.post.toString()));
    }

    formattedPosts = posts.map(p => {
      const postObj = p.toObject();
      const idStr = p._id.toString();
      return {
        ...postObj,
        author: {
          _id: user._id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar
        },
        hasLiked: likedPostIds.has(idStr),
        isLiked: likedPostIds.has(idStr),
        isSaved: savedPostIds.has(idStr)
      };
    });
  } else {
    totalPosts = await Post.countDocuments({ author: user._id, status: 'published' });
  }

  const followersCount = await Follow.countDocuments({ following: user._id });
  const followingCount = await Follow.countDocuments({ follower: user._id });

  const profileData = {
    _id: user._id,
    username: user.username,
    displayName: user.displayName || user.username,
    email: isSelf ? user.email : undefined,
    avatar: user.avatar,
    bio: user.bio,
    role: user.role,
    followersCount,
    followingCount,
    postsCount: totalPosts,
    isFollowing: !!isFollowing,
    isSelf,
    isBlocked: !!isBlocked,
    privacySettings: user.privacySettings || { isPrivate: false, allowDirectMessages: true },
    createdAt: user.createdAt
  };

  res.status(200).json({ profile: profileData, posts: formattedPosts });
});

// @desc    Update authenticated user's profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Strict allowlist validation
  if (typeof req.body.displayName === 'string') user.displayName = req.body.displayName.trim().slice(0, 50);
  if (typeof req.body.bio === 'string') user.bio = req.body.bio.trim().slice(0, 300);
  if (typeof req.body.avatar === 'string') user.avatar = req.body.avatar.trim();
  if (req.body.privacySettings && typeof req.body.privacySettings === 'object') {
    if (typeof req.body.privacySettings.isPrivate === 'boolean') {
      user.privacySettings.isPrivate = req.body.privacySettings.isPrivate;
    }
    if (typeof req.body.privacySettings.allowDirectMessages === 'boolean') {
      user.privacySettings.allowDirectMessages = req.body.privacySettings.allowDirectMessages;
    }
  }

  const updatedUser = await user.save();

  res.status(200).json({
    success: true,
    user: {
      _id: updatedUser._id,
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      email: updatedUser.email,
      bio: updatedUser.bio,
      avatar: updatedUser.avatar,
      followersCount: updatedUser.followersCount || 0,
      followingCount: updatedUser.followingCount || 0,
      postsCount: updatedUser.postsCount || 0,
      privacySettings: updatedUser.privacySettings
    },
    message: 'Profile updated successfully'
  });
});

// @desc    Follow or Unfollow a user
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
  if (!targetUser || targetUser.isBanned) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check blocking
  const isBlocked = await Block.isBlocked(currentUserId, targetId);
  if (isBlocked) {
    res.status(403);
    throw new Error('Cannot follow this user due to privacy/blocking settings.');
  }

  const existingFollow = await Follow.findOne({ follower: currentUserId, following: targetId });
  let isFollowing = false;

  if (existingFollow) {
    await Follow.deleteOne({ _id: existingFollow._id });
    await Promise.all([
      User.findByIdAndUpdate(currentUserId, { $inc: { followingCount: -1 } }),
      User.findByIdAndUpdate(targetId, { $inc: { followersCount: -1 } }),
      Notification.deleteMany({ recipient: targetId, sender: currentUserId, type: 'follow' })
    ]);
    isFollowing = false;
  } else {
    await Follow.create({ follower: currentUserId, following: targetId });
    await Promise.all([
      User.findByIdAndUpdate(currentUserId, { $inc: { followingCount: 1 } }),
      User.findByIdAndUpdate(targetId, { $inc: { followersCount: 1 } }),
      Notification.create({
        recipient: targetId,
        sender: currentUserId,
        type: 'follow',
        text: 'started following you.'
      })
    ]);
    isFollowing = true;
  }

  const [followersCount, followingCount] = await Promise.all([
    Follow.countDocuments({ following: targetId }),
    Follow.countDocuments({ follower: currentUserId })
  ]);

  res.status(200).json({
    success: true,
    isFollowing,
    followersCount,
    followingCount,
    message: isFollowing ? 'Followed successfully' : 'Unfollowed successfully'
  });
});

// @desc    Block a user
// @route   POST /api/users/:id/block
// @access  Private
export const blockUser = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  const currentUserId = req.user._id;

  if (targetId === currentUserId.toString()) {
    res.status(400);
    throw new Error('You cannot block yourself');
  }

  const targetUser = await User.findById(targetId);
  if (!targetUser) {
    res.status(404);
    throw new Error('User not found');
  }

  await Block.findOneAndUpdate(
    { blocker: currentUserId, blocked: targetId },
    { blocker: currentUserId, blocked: targetId },
    { upsert: true }
  );

  // Remove any follow relationships between both users
  await Promise.all([
    Follow.deleteMany({
      $or: [
        { follower: currentUserId, following: targetId },
        { follower: targetId, following: currentUserId }
      ]
    }),
    Notification.deleteMany({
      $or: [
        { recipient: targetId, sender: currentUserId },
        { recipient: currentUserId, sender: targetId }
      ]
    })
  ]);

  res.status(200).json({ success: true, message: 'User blocked successfully' });
});

// @desc    Unblock a user
// @route   POST /api/users/:id/unblock
// @access  Private
export const unblockUser = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  const currentUserId = req.user._id;

  await Block.deleteOne({ blocker: currentUserId, blocked: targetId });
  res.status(200).json({ success: true, message: 'User unblocked successfully' });
});

// @desc    Get user followers
// @route   GET /api/users/:id/followers
// @access  Public
export const getUserFollowers = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  const followRecords = await Follow.find({ following: targetId })
    .populate('follower', 'username displayName avatar bio')
    .sort({ createdAt: -1 });

  const followers = followRecords.map(f => f.follower).filter(Boolean);
  res.status(200).json(followers);
});

// @desc    Get user following
// @route   GET /api/users/:id/following
// @access  Public
export const getUserFollowing = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  const followRecords = await Follow.find({ follower: targetId })
    .populate('following', 'username displayName avatar bio')
    .sort({ createdAt: -1 });

  const following = followRecords.map(f => f.following).filter(Boolean);
  res.status(200).json(following);
});

// @desc    Get suggested users from real registered users
// @route   GET /api/users/suggestions
// @access  Private
export const getSuggestedUsers = asyncHandler(async (req, res) => {
  const [followingRecords, blockedRecords] = await Promise.all([
    Follow.find({ follower: req.user._id }).select('following'),
    Block.find({ $or: [{ blocker: req.user._id }, { blocked: req.user._id }] })
  ]);

  const excludedIds = new Set([
    req.user._id.toString(),
    ...followingRecords.map(f => f.following.toString()),
    ...blockedRecords.map(b => (b.blocker.toString() === req.user._id.toString() ? b.blocked.toString() : b.blocker.toString()))
  ]);

  const suggestions = await User.find({
    _id: { $nin: Array.from(excludedIds) },
    isBanned: false
  })
  .select('username displayName avatar bio followersCount')
  .limit(8);

  res.status(200).json(suggestions);
});

// @desc    Search users by username or displayName
// @route   GET /api/users/search/query
// @access  Public
export const searchUsers = asyncHandler(async (req, res) => {
  const rawQuery = (req.query.q || '').trim();
  if (!rawQuery || rawQuery.length > 50) return res.status(200).json([]);

  const sanitized = escapeRegex(rawQuery);

  const results = await User.find({
    $or: [
      { username: { $regex: sanitized, $options: 'i' } },
      { displayName: { $regex: sanitized, $options: 'i' } }
    ],
    isBanned: false
  })
  .select('username displayName avatar bio followersCount')
  .limit(12);

  res.status(200).json(results);
});
