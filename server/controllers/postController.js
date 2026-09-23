import redis from '../config/redis.js';
import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Like from '../models/Like.js';
import SavedPost from '../models/SavedPost.js';
import Notification from '../models/Notification.js';
import Community from '../models/Community.js';
import MediaAnalysis from '../models/MediaAnalysis.js';
import Follow from '../models/Follow.js';
import Block from '../models/Block.js';
import { canViewPost, canDeletePost } from '../policies/authorization.js';

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = asyncHandler(async (req, res) => {
  const { caption, body, communityId, mediaUrls, mediaIds, tags } = req.body;

  const contentText = (caption || body || '').trim();
  const rawMediaList = Array.isArray(mediaUrls) ? mediaUrls : (mediaUrls ? [mediaUrls] : []);

  // Validate that media URLs are relative uploaded paths and not malicious remote URLs
  const mediaList = rawMediaList.filter(url => {
    if (typeof url !== 'string') return false;
    const clean = url.trim();
    return clean.startsWith('/api/uploads/') || clean.startsWith('/uploads/');
  });

  if (!contentText && mediaList.length === 0) {
    res.status(400);
    throw new Error('Please provide text or media for your post');
  }

  let assignedCommunity = null;
  if (communityId && mongoose.Types.ObjectId.isValid(communityId)) {
    const comm = await Community.findById(communityId);
    if (comm) {
      assignedCommunity = comm._id;
      comm.postCount = (comm.postCount || 0) + 1;
      await comm.save();
    }
  }

  // Extract hashtags if present
  const extractedTags = tags || (contentText.match(/#[a-zA-Z0-9_]+/g) || []).map(t => t.slice(1).toLowerCase());

  // Determine media type
  let mediaType = 'text';
  if (mediaList.length > 0) {
    const isVideo = mediaList.some(url => url.endsWith('.mp4') || url.endsWith('.webm'));
    mediaType = isVideo ? 'video' : 'image';
  }

  // Find associated MediaAnalysis records if mediaIds or mediaUrls provided (ensuring uploader ownership)
  let analysisDocIds = [];
  if (Array.isArray(mediaIds) && mediaIds.length > 0) {
    const validMediaIds = mediaIds.filter(id => typeof id === 'string' && /^[a-zA-Z0-9_\-\.]+$/.test(id));
    const analysisDocs = await MediaAnalysis.find({
      mediaId: { $in: validMediaIds },
      $or: [{ uploader: req.user._id }, { uploader: null }]
    });
    analysisDocIds = analysisDocs.map(d => d._id);
  } else if (mediaList.length > 0) {
    const analysisDocs = await MediaAnalysis.find({
      mediaUrl: { $in: mediaList },
      $or: [{ uploader: req.user._id }, { uploader: null }]
    });
    analysisDocIds = analysisDocs.map(d => d._id);
  }

  const post = await Post.create({
    caption: contentText,
    body: contentText,
    author: req.user._id,
    community: assignedCommunity,
    mediaUrls: mediaList,
    mediaAnalysis: analysisDocIds,
    mediaType,
    tags: extractedTags,
    status: 'pending_review'
  });

  try {
    await redis.lpush('moderation:queue', JSON.stringify({ postId: String(post._id) }));
  } catch {
    post.moderationError = 'Automatic detection unavailable. Awaiting moderator review.';
    await post.save();
  }

  // Link Post ID back to MediaAnalysis documents
  if (analysisDocIds.length > 0) {
    await MediaAnalysis.updateMany(
      { _id: { $in: analysisDocIds } },
      { $set: { post: post._id, uploader: req.user._id } }
    );
  }

  // Increment user's post count
  await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: 1 } });

  const populatedPost = await Post.findById(post._id)
    .populate('author', 'username displayName avatar bio')
    .populate('community', 'name slug icon')
    .populate('mediaAnalysis');

  res.status(201).json({
    success: true,
    post: {
      ...populatedPost.toObject(),
      hasLiked: false,
      isSaved: false
    },
    message: 'Post submitted for review'
  });
});

// @desc    Get feed posts (Public with optional auth)
// @route   GET /api/posts
// @access  Public (Optional Auth)
export const getPosts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const query = { status: 'published' };

  if (req.query.community) {
    if (mongoose.Types.ObjectId.isValid(req.query.community)) {
      query.community = req.query.community;
    } else {
      const comm = await Community.findOne({ slug: req.query.community.toLowerCase() });
      if (comm) query.community = comm._id;
    }
  }

  if (req.query.tag) {
    query.tags = req.query.tag.toLowerCase();
  }

  // Handle blocking: exclude authors who blocked or are blocked by req.user
  let followingSet = new Set();
  if (req.user) {
    const [blockedRecords, followingRecords] = await Promise.all([
      Block.find({ $or: [{ blocker: req.user._id }, { blocked: req.user._id }] }),
      Follow.find({ follower: req.user._id }).select('following')
    ]);

    const blockedIds = blockedRecords.map(b => 
      b.blocker.toString() === req.user._id.toString() ? b.blocked : b.blocker
    );

    if (blockedIds.length > 0) {
      query.author = { $nin: blockedIds };
    }

    followingRecords.forEach(f => followingSet.add(f.following.toString()));
  }

  const [rawPosts, total] = await Promise.all([
    Post.find(query)
      .populate('author', 'username displayName avatar bio privacySettings')
      .populate('community', 'name slug icon')
      .populate('mediaAnalysis')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Post.countDocuments(query)
  ]);

  // Filter out private posts if viewer is not following author
  const posts = rawPosts.filter(post => {
    if (!post.author) return false;
    const authorPrivacy = post.author.privacySettings || {};
    if (authorPrivacy.isPrivate) {
      const isAuthor = req.user && String(post.author._id) === String(req.user._id);
      const isFollowing = req.user && followingSet.has(String(post.author._id));
      const isPrivileged = req.user && ['admin', 'moderator'].includes(req.user.role);
      return isAuthor || isFollowing || isPrivileged;
    }
    return true;
  });

  // Check liked & saved status for logged-in user
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

  const formattedPosts = posts.map(post => {
    const postObj = post.toObject();
    const idStr = post._id.toString();
    return {
      ...postObj,
      hasLiked: likedPostIds.has(idStr),
      isLiked: likedPostIds.has(idStr),
      isSaved: savedPostIds.has(idStr)
    };
  });

  res.status(200).json({
    success: true,
    data: formattedPosts,
    posts: formattedPosts,
    total,
    page,
    hasMore: skip + posts.length < total
  });
});

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Public (Optional Auth)
export const getPostById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(404);
    throw new Error('Post not found');
  }

  const post = await Post.findById(req.params.id)
    .populate('author', 'username displayName avatar bio privacySettings')
    .populate('community', 'name slug icon description')
    .populate('mediaAnalysis');

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  let isFollowing = false;
  let isBlocked = false;

  if (req.user && post.author) {
    [isFollowing, isBlocked] = await Promise.all([
      Follow.exists({ follower: req.user._id, following: post.author._id }),
      Block.isBlocked(req.user._id, post.author._id)
    ]);
  }

  const authorized = canViewPost({
    user: req.user,
    post,
    isFollowing: Boolean(isFollowing),
    isBlocked: Boolean(isBlocked)
  });

  if (!authorized) {
    res.status(404);
    throw new Error('Post not found');
  }

  let hasLiked = false;
  let isSaved = false;

  if (req.user) {
    const [like, save] = await Promise.all([
      Like.findOne({ user: req.user._id, post: post._id }),
      SavedPost.findOne({ user: req.user._id, post: post._id })
    ]);
    hasLiked = !!like;
    isSaved = !!save;
  }

  res.status(200).json({
    success: true,
    post: {
      ...post.toObject(),
      hasLiked,
      isLiked: hasLiked,
      isSaved
    }
  });
});

// @desc    Like or Unlike a post
// @route   POST /api/posts/:id/like
// @access  Private
export const toggleLikePost = asyncHandler(async (req, res) => {
  const postId = req.params.id;
  const post = await Post.findById(postId);

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  const { action } = req.body || {};
  let hasLiked;

  if (action === 'like') {
    try {
      await Like.create({ user: req.user._id, post: postId });
      await Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } });
      hasLiked = true;
      if (post.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: post.author,
          sender: req.user._id,
          type: 'like',
          post: post._id,
          text: 'liked your post.'
        }).catch(() => {});
      }
    } catch {
      hasLiked = true;
    }
  } else if (action === 'unlike') {
    const deleted = await Like.findOneAndDelete({ user: req.user._id, post: postId });
    if (deleted) {
      await Post.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } });
    }
    hasLiked = false;
  } else {
    const existingLike = await Like.findOne({ user: req.user._id, post: postId });
    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });
      await Post.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } });
      hasLiked = false;
    } else {
      try {
        await Like.create({ user: req.user._id, post: postId });
        await Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } });
        hasLiked = true;
        if (post.author.toString() !== req.user._id.toString()) {
          await Notification.create({
            recipient: post.author,
            sender: req.user._id,
            type: 'like',
            post: post._id,
            text: 'liked your post.'
          }).catch(() => {});
        }
      } catch {
        hasLiked = true;
      }
    }
  }

  const updatedPost = await Post.findById(postId).select('likesCount');
  const currentCount = Math.max(0, updatedPost?.likesCount || 0);

  res.status(200).json({
    success: true,
    hasLiked,
    isLiked: hasLiked,
    likesCount: currentCount,
    message: hasLiked ? 'Post liked' : 'Post unliked'
  });
});

// @desc    Save or Unsave a post
// @route   POST /api/posts/:id/save
// @access  Private
export const toggleSavePost = asyncHandler(async (req, res) => {
  const postId = req.params.id;
  const post = await Post.findById(postId);

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  const { action } = req.body || {};
  let isSaved;

  if (action === 'save') {
    try {
      await SavedPost.create({ user: req.user._id, post: postId });
      await Post.findByIdAndUpdate(postId, { $inc: { savesCount: 1 } });
      isSaved = true;
    } catch {
      isSaved = true;
    }
  } else if (action === 'unsave') {
    const deleted = await SavedPost.findOneAndDelete({ user: req.user._id, post: postId });
    if (deleted) {
      await Post.findByIdAndUpdate(postId, { $inc: { savesCount: -1 } });
    }
    isSaved = false;
  } else {
    const existingSave = await SavedPost.findOne({ user: req.user._id, post: postId });
    if (existingSave) {
      await SavedPost.deleteOne({ _id: existingSave._id });
      await Post.findByIdAndUpdate(postId, { $inc: { savesCount: -1 } });
      isSaved = false;
    } else {
      try {
        await SavedPost.create({ user: req.user._id, post: postId });
        await Post.findByIdAndUpdate(postId, { $inc: { savesCount: 1 } });
        isSaved = true;
      } catch {
        isSaved = true;
      }
    }
  }

  const updatedPost = await Post.findById(postId).select('savesCount');
  const currentSaves = Math.max(0, updatedPost?.savesCount || 0);

  res.status(200).json({
    success: true,
    isSaved,
    savesCount: currentSaves,
    message: isSaved ? 'Post saved to your bookmarks' : 'Post removed from your bookmarks'
  });
});

// @desc    Get user's saved posts
// @route   GET /api/posts/saved
// @access  Private
export const getSavedPosts = asyncHandler(async (req, res) => {
  const savedEntries = await SavedPost.find({ user: req.user._id })
    .populate({
      path: 'post',
      populate: [
        { path: 'author', select: 'username displayName avatar bio' },
        { path: 'community', select: 'name slug icon' },
        { path: 'mediaAnalysis' }
      ]
    })
    .sort({ createdAt: -1 });

  // Filter out any deleted posts
  const posts = savedEntries
    .filter(entry => entry.post && entry.post.status === 'published')
    .map(entry => ({
      ...entry.post.toObject(),
      isSaved: true,
      hasLiked: false
    }));

  res.status(200).json(posts);
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

  // Ensure author or admin/moderator
  if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'moderator') {
    res.status(403);
    throw new Error('You are not authorized to delete this post');
  }

  await Promise.all([
    Post.deleteOne({ _id: post._id }),
    MediaAnalysis.deleteMany({ post: post._id }),
    Like.deleteMany({ post: post._id }),
    SavedPost.deleteMany({ post: post._id }),
    Notification.deleteMany({ post: post._id }),
    User.findByIdAndUpdate(post.author, { $inc: { postsCount: -1 } })
  ]);

  res.status(200).json({ success: true, message: 'Post deleted successfully' });
});
