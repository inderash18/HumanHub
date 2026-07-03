import asyncHandler from '../utils/asyncHandler.js';
import Notification from '../models/Notification.js';

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = asyncHandler(async (req, res) => {
  const list = await Notification.find({ recipient: req.user._id })
    .populate('sender', 'username avatar')
    .sort({ createdAt: -1 })
    .limit(30);

  res.json(list);
});

// @desc    Mark all notifications as read
// @route   POST /api/notifications/read-all
// @access  Private
export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );

  res.json({ success: true });
});

// Helper utility to create notifications
export const createNotification = async ({ recipient, sender, type, postId, body }) => {
  try {
    if (recipient.toString() === sender?.toString()) return; // Don't notify self
    await Notification.create({ recipient, sender, type, postId, body });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
};
