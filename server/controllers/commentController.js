import asyncHandler from '../utils/asyncHandler.js';
import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import { createNotification } from './notificationController.js';

// @desc    Create a new comment
// @route   POST /api/comments
// @access  Private
export const createComment = asyncHandler(async (req, res) => {
  const { body, postId, parentId } = req.body;
  
  let depth = 0;
  if (parentId) {
    const parent = await Comment.findById(parentId);
    if (!parent) {
      res.status(404);
      throw new Error('Parent comment not found');
    }
    depth = parent.depth + 1;
    if (depth > 6) {
      res.status(400);
      throw new Error('Maximum reply depth reached');
    }
  }

  const comment = await Comment.create({
    body,
    author: req.user._id,
    post: postId,
    parent: parentId || null,
    depth
  });

  // Fetch parent post
  const postObj = await Post.findById(postId);
  if (postObj) {
    // 1. Notify post author
    await createNotification({
      recipient: postObj.author,
      sender: req.user._id,
      type: 'comment',
      postId: postObj._id,
      body: `@${req.user.username} commented on your post.`
    });
  }

  // 2. Notify parent comment author if reply
  if (parentId) {
    const parentComment = await Comment.findById(parentId);
    if (parentComment) {
      await createNotification({
        recipient: parentComment.author,
        sender: req.user._id,
        type: 'comment',
        postId: postId,
        body: `@${req.user.username} replied to your comment.`
      });
    }
  }

  res.status(201).json(comment);
});

// @desc    Get comments for post
// @route   GET /api/comments/:postId
// @access  Public
export const getCommentsByPost = asyncHandler(async (req, res) => {
  // Simple flat fetch — nested tree assembly done client-side usually for large threads, 
  // or done here using Mongoose graphLookup / recursive functions
  const comments = await Comment.find({ post: req.params.postId })
    .populate('author', 'username avatar trustScore role')
    .sort({ upvotes: -1 });

  res.json(comments);
});

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'moderator') {
    res.status(403);
    throw new Error('Not authorized to delete this comment');
  }

  comment.isRemoved = true;
  comment.body = '[Comment removed by moderator]';
  await comment.save();

  res.json({ message: 'Comment deleted' });
});
