import asyncHandler from '../utils/asyncHandler.js';
import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import Notification from '../models/Notification.js';

// @desc    Create a new comment
// @route   POST /api/comments
// @access  Private
export const createComment = asyncHandler(async (req, res) => {
  const { text, body, postId } = req.body;
  const commentText = (text || body || '').trim();

  if (!commentText || !postId) {
    res.status(400);
    throw new Error('Please provide comment text and postId');
  }

  const post = await Post.findById(postId);
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  const comment = await Comment.create({
    text: commentText,
    author: req.user._id,
    post: postId
  });

  // Increment comments count on post
  post.commentsCount = (post.commentsCount || 0) + 1;
  await post.save();

  // Send notification to post author if not self
  if (post.author.toString() !== req.user._id.toString()) {
    await Notification.create({
      recipient: post.author,
      sender: req.user._id,
      type: 'comment',
      post: post._id,
      comment: comment._id,
      text: 'commented on your post.'
    });
  }

  const populatedComment = await Comment.findById(comment._id)
    .populate('author', 'username displayName avatar bio');

  res.status(201).json(populatedComment);
});

// @desc    Get comments for a post
// @route   GET /api/comments/:postId
// @access  Public
export const getCommentsByPost = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ post: req.params.postId })
    .populate('author', 'username displayName avatar bio')
    .sort({ createdAt: 1 });

  res.status(200).json(comments);
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

  if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'moderator') {
    res.status(403);
    throw new Error('Not authorized to delete this comment');
  }

  await Promise.all([
    Comment.deleteOne({ _id: comment._id }),
    Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } }),
    Notification.deleteMany({ comment: comment._id })
  ]);

  res.status(200).json({ success: true, message: 'Comment deleted successfully' });
});
