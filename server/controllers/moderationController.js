import asyncHandler from '../utils/asyncHandler.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Session from '../models/Session.js';
import ModerationLog from '../models/ModerationLog.js';
import { getIO } from '../socket/socketHandler.js';

export const getQueue = asyncHandler(async (req, res) => {
  res.json(await Post.find({ status: 'pending_review' })
    .populate('author', 'username').sort({ createdAt: 1 }).limit(20));
});

function decide(status, action) {
  return asyncHandler(async (req, res) => {
    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, status: 'pending_review' },
      { $set: { status, moderationError: '' } }, { new: true, runValidators: true }
    );
    if (!post) return res.status(409).json({ message: 'Post is missing or already reviewed.' });
    await ModerationLog.create({
      moderator: req.user._id, targetId: post._id, targetType: 'post', action,
      reason: typeof req.body.reason === 'string' && req.body.reason.trim()
        ? req.body.reason.trim().slice(0, 1000) : 'Manual moderator review',
      aiScoresAtTime: post.detectionScores
    });
    getIO()?.to('user_' + post.author).emit('post:verified', { postId: post._id, status });
    res.json({ success: true, message: status === 'published' ? 'Post approved' : 'Post blocked' });
  });
}
export const approveItem = decide('published', 'approve');
export const rejectItem = decide('blocked', 'reject');

export const banUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (String(user._id) === String(req.user._id) || user.role === 'admin' ||
      req.user.role !== 'admin' && user.role === 'moderator') {
    return res.status(403).json({ message: 'You cannot suspend this account.' });
  }
  user.isBanned = true;
  await user.save();
  await Session.updateMany({ user: user._id }, { $set: { revokedAt: new Date() } });
  getIO()?.in('user_' + user._id).disconnectSockets(true);
  await ModerationLog.create({
    moderator: req.user._id, targetId: user._id, targetType: 'user',
    action: 'ban', reason: 'Account suspended by moderator'
  });
  res.json({ success: true, message: 'Account suspended' });
});

export const getStats = asyncHandler(async (req, res) => {
  const [pending, blocked, published, bannedUsers] = await Promise.all([
    Post.countDocuments({ status: 'pending_review' }), Post.countDocuments({ status: 'blocked' }),
    Post.countDocuments({ status: 'published' }), User.countDocuments({ isBanned: true })
  ]);
  res.json({ pending, blocked, published, bannedUsers });
});

export const getAudit = asyncHandler(async (req, res) => {
  res.json(await ModerationLog.find().sort({ createdAt: -1 }).limit(100)
    .populate('moderator', 'username'));
});
