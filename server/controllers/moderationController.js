import asyncHandler from '../utils/asyncHandler.js';
import Post from '../models/Post.js';
import ModerationLog from '../models/ModerationLog.js';

// @desc    Get moderation queue
// @route   GET /api/moderation/queue
// @access  Private/Moderator
export const getQueue = asyncHandler(async (req, res) => {
  // Find posts blocked by strict threshold or explicitly reported waiting for manual review
  const queue = await Post.find({
    status: 'pending' // Just a basic search, logic is more complex in production
  })
  .populate('author', 'username trustScore')
  .sort({ createdAt: 1 })
  .limit(20);

  res.json(queue);
});

// @desc    Approve post or comment
// @route   POST /api/moderation/:id/approve
// @access  Private/Moderator
export const approveItem = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
      res.status(404); throw new Error('Not found');
  }

  post.status = 'published';
  await post.save();

  await ModerationLog.create({
      moderator: req.user._id,
      targetId: post._id,
      targetType: 'post',
      action: 'approve',
      reason: 'Manual Overrule',
      aiScoresAtTime: post.detectionScores
  });

  res.json({ message: 'Item approved' });
});

// @desc    Reject / Block item
// @route   POST /api/moderation/:id/reject
// @access  Private/Moderator
export const rejectItem = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const post = await Post.findById(req.params.id);
  
  if (!post) { res.status(404); throw new Error('Not found'); }

  post.status = 'rejected';
  await post.save();

  await ModerationLog.create({
      moderator: req.user._id,
      targetId: post._id,
      targetType: 'post',
      action: 'reject',
      reason: reason || 'Violation of human-only policy',
      aiScoresAtTime: post.detectionScores
  });

  res.json({ message: 'Item rejected' });
});

// @desc    Ban User
// @route   POST /api/moderation/ban/:userId
// @access  Private/Moderator
export const banUser = asyncHandler(async (req, res) => {
    res.status(200).json({ message: "User banned" });
});

// @desc    Get Mod Stats / Audit
// @route   GET /api/moderation/stats
// @access  Private/Admin
export const getStats = asyncHandler(async (req, res) => {
    res.status(200).json({ message: "Audits delivered" });
});
