import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Like from '../models/Like.js';
import SavedPost from '../models/SavedPost.js';
import Notification from '../models/Notification.js';
import Community from '../models/Community.js';

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = asyncHandler(async (req, res) => {
  const { caption, body, communityId, mediaUrls, tags } = req.body;

  const contentText = (caption || body || '').trim();
  const mediaList = Array.isArray(mediaUrls) ? mediaUrls : (mediaUrls ? [mediaUrls] : []);

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

  const post = await Post.create({
    caption: contentText,
    body: contentText,
    author: req.user._id,
    community: assignedCommunity,
    mediaUrls: mediaList,
    mediaType,
    tags: extractedTags,
    status: 'published'
  });

  // Increment user's post count
  await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: 1 } });

  const populatedPost = await Post.findById(post._id)
    .populate('author', 'username displayName avatar bio')
    .populate('community', 'name slug icon');

  res.status(201).json({
    success: true,
    post: {
      ...populatedPost.toObject(),
      hasLiked: false,
      isSaved: false
    },
    message: 'Post published successfully'
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

  const [posts, total] = await Promise.all([
    Post.find(query)
      .populate('author', 'username displayName avatar bio')
      .populate('community', 'name slug icon')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Post.countDocuments(query)
  ]);

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
  const post = await Post.findById(req.params.id)
    .populate('author', 'username displayName avatar bio')
    .populate('community', 'name slug icon description');

  if (!post || post.status === 'blocked') {
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

  const existingLike = await Like.findOne({ user: req.user._id, post: postId });
  let hasLiked = false;

  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    post.likesCount = Math.max(0, (post.likesCount || 0) - 1);
    hasLiked = false;
  } else {
    await Like.create({ user: req.user._id, post: postId });
    post.likesCount = (post.likesCount || 0) + 1;
    hasLiked = true;

    // Trigger notification to author if someone else liked
    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'like',
        post: post._id,
        text: 'liked your post.'
      });
    }
  }

  await post.save();

  res.status(200).json({
    success: true,
    hasLiked,
    isLiked: hasLiked,
    likesCount: post.likesCount,
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

  const existingSave = await SavedPost.findOne({ user: req.user._id, post: postId });
  let isSaved = false;

  if (existingSave) {
    await SavedPost.deleteOne({ _id: existingSave._id });
    post.savesCount = Math.max(0, (post.savesCount || 0) - 1);
    isSaved = false;
  } else {
    await SavedPost.create({ user: req.user._id, post: postId });
    post.savesCount = (post.savesCount || 0) + 1;
    isSaved = true;
  }

  await post.save();

  res.status(200).json({
    success: true,
    isSaved,
    savesCount: post.savesCount,
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
        { path: 'community', select: 'name slug icon' }
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
    Like.deleteMany({ post: post._id }),
    SavedPost.deleteMany({ post: post._id }),
    Notification.deleteMany({ post: post._id }),
    User.findByIdAndUpdate(post.author, { $inc: { postsCount: -1 } })
  ]);

  res.status(200).json({ success: true, message: 'Post deleted successfully' });
});
