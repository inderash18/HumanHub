import asyncHandler from '../utils/asyncHandler.js';
import Notification from '../models/Notification.js';
import { getIO } from '../socket/socketHandler.js';

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = asyncHandler(async (req, res) => {
  const list = await Notification.find({ recipient: req.user._id })
    .populate('sender', 'username displayName avatar trustScore isVerified')
    .sort({ createdAt: -1 })
    .limit(40);

  res.json(list);
});

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ 
    recipient: req.user._id, 
    isRead: false 
  });

  res.json({ count });
});

// @desc    Mark all notifications as read
// @route   POST /api/notifications/read-all
// @access  Private
export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );

  res.json({ success: true, count: 0 });
});

// Helper utility to create notifications
export const createNotification = async ({ recipient, sender, type, postId, body }) => {
  try {
    if (!recipient || recipient.toString() === sender?.toString()) return; // Don't notify self
    
    const notif = await Notification.create({ recipient, sender, type, postId, body });
    const populated = await notif.populate('sender', 'username displayName avatar trustScore isVerified');

    try {
      const io = getIO();
      if (io) {
        io.to(`user_${recipient.toString()}`).emit('notification:new', {
          notification: populated,
          message: body
        });
      }
    } catch (socketErr) {
      console.log('[Socket Notif Notice]', socketErr.message);
    }
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
};

