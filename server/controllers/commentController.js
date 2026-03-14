import asyncHandler from '../utils/asyncHandler.js';
import Comment from '../models/Comment.js';

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

  // Assuming text detection on comments via direct HTTP call since comments shouldn't queue like large video posts
  // (In real scale, we might push them to Redis queue just the same)
  
  const comment = await Comment.create({
    body,
    author: req.user._id,
    post: postId,
    parent: parentId || null,
    depth
  });

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
