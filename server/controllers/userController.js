import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Vote from '../models/Vote.js';
import { createNotification } from './notificationController.js';

// @desc    Get user profile by ID or username
// @route   GET /api/users/:id
// @access  Public (Optional Auth)
export const getUserProfile = asyncHandler(async (req, res) => {
  const identifier = req.params.id;
  const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);

  const user = await (isObjectId 
    ? User.findById(identifier) 
    : User.findOne({ username: new RegExp(`^${identifier}$`, 'i') }))
    .select('-passwordHash -email');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const posts = await Post.find({ author: user._id, status: 'published' })
    .populate('community', 'name slug iconUrl')
    .sort({ createdAt: -1 })
    .limit(30);

  const totalPostsCount = await Post.countDocuments({ author: user._id, status: 'published' });

  let userVotesMap = new Map();
  let userSavedSet = new Set();
  let isFollowing = false;

  if (req.user) {
    if (posts.length > 0) {
      const postIds = posts.map(p => p._id);
      const votes = await Vote.find({
        user: req.user._id,
        targetType: 'post',
        targetId: { $in: postIds }
      });
      votes.forEach(v => {
        userVotesMap.set(v.targetId.toString(), v.value);
      });
    }

    const currentReqUser = await User.findById(req.user._id).select('savedPosts following');
    if (currentReqUser) {
      (currentReqUser.savedPosts || []).forEach(id => userSavedSet.add(id.toString()));
      isFollowing = (currentReqUser.following || []).some(id => id.toString() === user._id.toString());
    }
  }

  const formattedPosts = posts.map(p => {
    const postObj = p.toObject();
    const voteVal = userVotesMap.get(p._id.toString()) || 0;
    const isSaved = userSavedSet.has(p._id.toString());
    return {
      ...postObj,
      userVote: voteVal,
      isLiked: voteVal === 1,
      hasLiked: voteVal === 1,
      isSaved
    };
  });

  const profileData = {
    _id: user._id,
    username: user.username,
    displayName: user.displayName || user.username,
    avatar: user.avatar,
    bio: user.bio,
    role: user.role,
    trustScore: user.trustScore ?? 0.95,
    isVerified: user.isVerified ?? true,
    emailVerified: user.emailVerified ?? true,
    followersCount: user.followers?.length || 0,
    followingCount: user.following?.length || 0,
    postsCount: totalPostsCount,
    savedCount: user.savedPosts?.length || 0,
    isFollowing,
    privacySettings: user.privacySettings || { isPrivate: false, hideActivity: false, allowDirectMessages: true },
    createdAt: user.createdAt
  };

  res.json({ profile: profileData, posts: formattedPosts });
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

    if (req.body.displayName !== undefined) user.displayName = req.body.displayName.trim();
    if (req.body.bio !== undefined) user.bio = req.body.bio.trim();
    if (req.body.avatar !== undefined) user.avatar = req.body.avatar.trim();
    if (req.body.privacySettings) {
      user.privacySettings = {
        ...user.privacySettings,
        ...req.body.privacySettings
      };
    }

    const updatedUser = await user.save();
    res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        displayName: updatedUser.displayName,
        email: updatedUser.email,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
        trustScore: updatedUser.trustScore,
        isVerified: updatedUser.isVerified,
        privacySettings: updatedUser.privacySettings
    });
});

// @desc    Upload profile avatar image
// @route   POST /api/users/avatar
// @access  Private
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please select an image file to upload');
  }

  const avatarUrl = `/api/uploads/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: avatarUrl },
    { new: true, runValidators: true }
  ).select('-passwordHash');

  res.json({
    success: true,
    message: 'Profile image updated successfully',
    avatar: avatarUrl,
    user
  });
});

// @desc    Get user followers
// @route   GET /api/users/:id/followers
// @access  Private
export const getUserFollowers = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('followers', 'username displayName avatar trustScore isVerified bio');
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json(user.followers || []);
});

// @desc    Get user following
// @route   GET /api/users/:id/following
// @access  Private
export const getUserFollowing = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('following', 'username displayName avatar trustScore isVerified bio');
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json(user.following || []);
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
  const currentUser = await User.findById(req.user._id).select('following');
  const followingIds = currentUser?.following || [];

  const suggestions = await User.find({
    _id: { $nin: [...followingIds, req.user._id] },
    username: { $nin: ['dhruvit_system', 'system', 'admin'] },
    role: { $ne: 'system' },
    isBanned: false
  })
  .select('username displayName avatar trustScore isVerified bio followers')
  .limit(6);

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

  if (!currentUser.following) currentUser.following = [];
  if (!targetUser.followers) targetUser.followers = [];

  const isFollowing = currentUser.following.some(id => id.toString() === targetId);

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
      body: `@${currentUser.username} is now following your authentic human journey.`
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

// @desc    Search users by username or displayName
// @route   GET /api/users/search/query
// @access  Private
export const searchUsers = asyncHandler(async (req, res) => {
  const query = req.query.q || '';
  if (!query.trim()) return res.json([]);
  
  const results = await User.find({
    $or: [
      { username: { $regex: query.trim(), $options: 'i' } },
      { displayName: { $regex: query.trim(), $options: 'i' } }
    ],
    username: { $nin: ['dhruvit_system', 'system', 'admin'] },
    role: { $ne: 'system' },
    isBanned: false
  })
  .select('username displayName avatar trustScore isVerified bio')
  .limit(10);

  res.json(results);
});





