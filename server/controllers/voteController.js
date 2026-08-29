import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import Vote from '../models/Vote.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import { createNotification } from './notificationController.js';
import { getIO } from '../socket/socketHandler.js';

// @desc    Vote on post or comment
// @route   POST /api/:type/:id/vote
// @access  Private
export const handleVote = asyncHandler(async (req, res) => {
  const id = req.params.id || req.params.postId || req.params.commentId || req.body.targetId || req.body.postId;
  const rawValue = req.body.value !== undefined ? req.body.value : req.body.direction;
  const value = parseInt(rawValue, 10);
  const type = (req.baseUrl?.includes('comment') || req.originalUrl?.includes('comment')) ? 'comment' : 'post';
  const Model = type === 'post' ? Post : Comment;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid or missing target ID');
  }

  const target = await Model.findById(id);
  if (!target) {
    res.status(404);
    throw new Error(`${type} not found`);
  }

  // Find existing vote
  const existingVote = await Vote.findOne({
    user: req.user._id,
    targetId: id,
    targetType: type
  });

  // Math logic to update totals
  let upDiff = 0;
  let downDiff = 0;

  if (existingVote) {
    if (value === 0) {
      // Clear vote
      if (existingVote.value === 1) upDiff = -1;
      else if (existingVote.value === -1) downDiff = -1;
      await existingVote.deleteOne();
    } else if (existingVote.value !== value) {
      // Swap vote
      if (value === 1) { upDiff = 1; downDiff = -1; }
      else if (value === -1) { upDiff = -1; downDiff = 1; }
      existingVote.value = value;
      await existingVote.save();
    }
  } else if (value === 1 || value === -1) {
    // New vote
    if (value === 1) upDiff = 1;
    else if (value === -1) downDiff = 1;
    await Vote.create({
      user: req.user._id,
      targetId: id,
      targetType: type,
      value
    });
  }

  target.upvotes = Math.max(0, (target.upvotes || 0) + upDiff);
  target.downvotes = Math.max(0, (target.downvotes || 0) + downDiff);

  // Dispatch notification for like/upvote
  if (value === 1 && upDiff === 1 && target.author && target.author.toString() !== req.user._id.toString()) {
    try {
      await createNotification({
        recipient: target.author,
        sender: req.user._id,
        type: 'like',
        postId: type === 'post' ? target._id : target.post,
        body: `@${req.user.username} liked your ${type}.`
      });
    } catch (notifErr) {
      console.log('[Notification Warning]', notifErr.message);
    }
  }

  // Recalculate HotScore if Post
  if (type === 'post') {
    const ageInHours = (Date.now() - new Date(target.createdAt).getTime()) / (1000 * 60 * 60);
    target.hotScore = (target.upvotes - target.downvotes + 1) / Math.pow(ageInHours + 2, 1.5);
  }

  await target.save();

  // Broadcast real-time update
  try {
    const io = getIO();
    if (io) {
      io.emit('post:voted', {
        postId: target._id.toString(),
        type,
        upvotes: target.upvotes,
        downvotes: target.downvotes,
        userId: req.user._id.toString(),
        value
      });
    }
  } catch (socketErr) {
    console.log('[Socket Broadcast Notice]', socketErr.message);
  }

  res.json({
    success: true,
    upvotes: target.upvotes,
    downvotes: target.downvotes,
    hotScore: target.hotScore,
    userVote: value,
    isLiked: value === 1,
    hasLiked: value === 1
  });
});

