import asyncHandler from '../utils/asyncHandler.js';
import Post from '../models/Post.js';
import redis from '../config/redis.js';

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = asyncHandler(async (req, res) => {
  const { title, body, communityId, mediaUrls } = req.body;

  // 1. Save post with status pending
  const post = await Post.create({
    title,
    body,
    author: req.user._id,
    community: communityId,
    mediaUrls: mediaUrls || [],
    status: 'pending'
  });

  // 2. Push job to Redis queue for moderation microservices
  await redis.lpush('moderation:queue', JSON.stringify({
    postId: post._id,
    type: 'post',
    authorId: req.user._id,
    content: { title, body, mediaUrls }
  }));

  res.status(201).json({
    message: 'Post submitted successfully. Verification in progress.',
    post
  });
});

// @desc    Get all posts (Feed)
// @route   GET /api/posts
// @access  Public
export const getPosts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 25;
  const cursor = req.query.cursor; // The hotScore from the last fetched post
  const query = { status: 'published' };

  if (cursor) {
    query.hotScore = { $lt: parseFloat(cursor) };
  }

  // Filter by community
  if (req.query.community) {
    query.community = req.query.community; // Need the _id here ideally, or use populate matching
  }

  const posts = await Post.find(query)
    .populate('author', 'username avatar trustScore')
    .populate('community', 'name slug iconUrl')
    .sort({ hotScore: -1 })
    .limit(limit);

  res.json({
    data: posts,
    // Return standard pagination cursor map bridging directly to client load triggers
    nextCursor: posts.length === limit ? posts[posts.length - 1].hotScore : null,
  });
});

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Public
export const getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate('author', 'username avatar trustScore')
    .populate('community', 'name slug rules');

  if (post) {
    res.json(post);
  } else {
    res.status(404);
    throw new Error('Post not found');
  }
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
    // Create new Report record implementation skipped for brevity
    res.status(200).json({ message: 'Post reported' });
});
