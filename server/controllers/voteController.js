import asyncHandler from '../utils/asyncHandler.js';
import Vote from '../models/Vote.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';

// @desc    Vote on post or comment
// @route   POST /api/:type/:id/vote
// @access  Private
export const handleVote = asyncHandler(async (req, res) => {
  // Actually maps to POST /api/posts/:id/vote OR /api/comments/:id/vote based on the router
  
  const { id } = req.params;
  const { value } = req.body; // 1 or -1, or 0 to clear
  const type = req.baseUrl.includes('post') ? 'post' : 'comment';
  const Model = type === 'post' ? Post : Comment;

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
      else downDiff = -1;
      await existingVote.deleteOne();
    } else if (existingVote.value !== value) {
      // Swap vote
      if (value === 1) { upDiff = 1; downDiff = -1; }
      else { upDiff = -1; downDiff = 1; }
      existingVote.value = value;
      await existingVote.save();
    }
  } else if (value !== 0) {
    // New vote
    if (value === 1) upDiff = 1;
    else downDiff = 1;
    await Vote.create({
      user: req.user._id,
      targetId: id,
      targetType: type,
      value
    });
  }

  target.upvotes += upDiff;
  target.downvotes += downDiff;

  // Recalculate HotScore if Post
  if (type === 'post') {
    const ageInHours = (Date.now() - target.createdAt.getTime()) / (1000 * 60 * 60);
    target.hotScore = (target.upvotes - target.downvotes + 1) / Math.pow(ageInHours + 2, 1.5);
  }

  await target.save();

  res.json({
    upvotes: target.upvotes,
    downvotes: target.downvotes,
    hotScore: target.hotScore
  });
});
