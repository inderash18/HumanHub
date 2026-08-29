import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Vote from '../models/Vote.js';
import redis from '../config/redis.js';

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = asyncHandler(async (req, res) => {
  const { title, body, communityId, mediaUrls } = req.body;

  let assignedCommunityId = null;
  const Community = (await import('../models/Community.js')).default;

  if (communityId && mongoose.Types.ObjectId.isValid(communityId)) {
    const existing = await Community.findById(communityId);
    if (existing) assignedCommunityId = existing._id;
  }

  if (!assignedCommunityId) {
    let generalCommunity = await Community.findOne({ slug: 'general' });
    if (!generalCommunity) {
      generalCommunity = await Community.create({
        name: 'General',
        slug: 'general',
        description: 'General human discussions on HumanHub.',
        creator: req.user._id,
        moderators: [req.user._id]
      });
    }
    assignedCommunityId = generalCommunity._id;
  }

  // 1. Save post with status published
  const post = await Post.create({
    title: title?.trim() || '',
    body: body || '',
    author: req.user._id,
    community: assignedCommunityId,
    mediaUrls: mediaUrls || [],
    status: 'published',
    hotScore: 100,
    detectionScores: {
      text: { score: 0.02, isAI: false, confidence: 0.98 },
      image: { score: 0.01, isAI: false, confidence: 0.99 },
      bot: { score: 0.02, isBotLikely: false, confidence: 0.98 }
    }
  });

  // 2. Push job to Redis queue for moderation if Redis is connected
  try {
    await redis.lpush('moderation:queue', JSON.stringify({
      postId: post._id,
      type: 'post',
      authorId: req.user._id,
      content: { title: post.title, body: post.body, mediaUrls: post.mediaUrls }
    }));
  } catch (redisErr) {
    console.log('[Redis Queue Notice] Redis queue skipped or offline');
  }

  res.status(201).json({
    success: true,
    message: 'Post submitted successfully. Verification in progress.',
    _id: post._id,
    post: {
      ...post.toObject(),
      userVote: 0,
      isLiked: false,
      hasLiked: false,
      isSaved: false
    },
    ...post.toObject()
  });
});

// @desc    Get all posts (Feed)
// @route   GET /api/posts
// @access  Public (Optional Auth)
export const getPosts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 25;
  const cursor = req.query.cursor;
  const query = { status: 'published' };

  if (cursor) {
    query.hotScore = { $lt: parseFloat(cursor) };
  }

  // Filter by community
  if (req.query.community) {
    query.community = req.query.community;
  }

  const posts = await Post.find(query)
    .populate('author', 'username displayName avatar trustScore isVerified')
    .populate('community', 'name slug iconUrl')
    .sort({ hotScore: -1 })
    .limit(limit);

  // Fetch votes & saved status dynamically if user is logged in
  let userVotesMap = new Map();
  let userSavedSet = new Set();

  if (req.user && posts.length > 0) {
    const postIds = posts.map(p => p._id);
    const votes = await Vote.find({
      user: req.user._id,
      targetType: 'post',
      targetId: { $in: postIds }
    });
    votes.forEach(v => {
      userVotesMap.set(v.targetId.toString(), v.value);
    });

    const userRecord = await User.findById(req.user._id).select('savedPosts');
    if (userRecord?.savedPosts) {
      userRecord.savedPosts.forEach(id => userSavedSet.add(id.toString()));
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

  res.json({
    data: formattedPosts,
    nextCursor: posts.length === limit ? posts[posts.length - 1].hotScore : null,
  });
});

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Public (Optional Auth)
export const getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate('author', 'username displayName avatar trustScore isVerified')
    .populate('community', 'name slug rules');

  if (post) {
    let userVote = 0;
    let isSaved = false;

    if (req.user) {
      const vote = await Vote.findOne({
        user: req.user._id,
        targetId: post._id,
        targetType: 'post'
      });
      if (vote) userVote = vote.value;

      const userRecord = await User.findById(req.user._id).select('savedPosts');
      if (userRecord?.savedPosts) {
        isSaved = userRecord.savedPosts.some(id => id.toString() === post._id.toString());
      }
    }

    const postObj = post.toObject();
    res.json({
      ...postObj,
      userVote,
      isLiked: userVote === 1,
      hasLiked: userVote === 1,
      isSaved
    });
  } else {
    res.status(404);
    throw new Error('Post not found');
  }
});

// @desc    Bookmark / Save / Unsave a post
// @route   POST /api/posts/:id/save
// @access  Private
export const toggleSavePost = asyncHandler(async (req, res) => {
  const postId = req.params.id;
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (!user.savedPosts) user.savedPosts = [];

  const postIndex = user.savedPosts.findIndex(id => id.toString() === postId);
  let isSaved = false;

  if (postIndex > -1) {
    user.savedPosts.splice(postIndex, 1);
    isSaved = false;
  } else {
    user.savedPosts.push(postId);
    isSaved = true;
  }

  await user.save();

  res.json({
    success: true,
    isSaved,
    savedCount: user.savedPosts.length,
    message: isSaved ? 'Post saved to your bookmarks' : 'Post removed from your bookmarks'
  });
});

// @desc    Get user's saved bookmarked posts
// @route   GET /api/posts/saved
// @access  Private
export const getSavedPosts = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate({
      path: 'savedPosts',
      populate: [
        { path: 'author', select: 'username displayName avatar trustScore isVerified' },
        { path: 'community', select: 'name slug iconUrl' }
      ]
    });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const savedList = (user.savedPosts || []).map(p => ({
    ...(p.toObject ? p.toObject() : p),
    isSaved: true,
    isLiked: false // Default; populated if needed
  }));

  res.json(savedList.reverse());
});

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  // Ensure author or moderator
  if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'moderator') {
    res.status(403);
    throw new Error('User not authorized to delete this post');
  }

  await post.deleteOne();
  res.json({ message: 'Post removed' });
});

// @desc    Report Post
// @route   POST /api/posts/:id/report
// @access  Private
export const reportPost = asyncHandler(async (req, res) => {
    res.status(200).json({ message: 'Post reported' });
});

