import Message from '../models/Message.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getIO } from '../socket/socketHandler.js';

// @desc    Send a new message
// @route   POST /api/messages
// @access  Private
export const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, text } = req.body;

  if (!receiverId || !text?.trim()) {
    res.status(400);
    throw new Error('Receiver ID and message text are required');
  }

  const message = await Message.create({
    sender: req.user._id,
    receiver: receiverId,
    text: text.trim()
  });

  await message.populate('sender', 'username displayName avatar trustScore isVerified');
  await message.populate('receiver', 'username displayName avatar trustScore isVerified');

  // Broadcast real-time message to socket rooms
  try {
    const io = getIO();
    if (io) {
      io.to(`user_${receiverId.toString()}`).emit('message:receive', message);
      io.to(`user_${req.user._id.toString()}`).emit('message:sent', message);
    }
  } catch (socketErr) {
    console.log('[Socket Message Notice]', socketErr.message);
  }

  res.status(201).json(message);
});

// @desc    Get message history between current user and target user
// @route   GET /api/messages/:userId
// @access  Private
export const getMessages = asyncHandler(async (req, res) => {
  const otherUserId = req.params.userId;
  const currentUserId = req.user._id;

  const messages = await Message.find({
    $or: [
      { sender: currentUserId, receiver: otherUserId },
      { sender: otherUserId, receiver: currentUserId }
    ]
  })
  .populate('sender', 'username displayName avatar trustScore isVerified')
  .populate('receiver', 'username displayName avatar trustScore isVerified')
  .sort({ createdAt: 1 });

  // Mark all unread messages received from the other user as read
  await Message.updateMany(
    { sender: otherUserId, receiver: currentUserId, unread: true },
    { $set: { unread: false } }
  );

  res.json(messages);
});

// @desc    Get total unread messages count for current user
// @route   GET /api/messages/unread-count
// @access  Private
export const getUnreadMessagesCount = asyncHandler(async (req, res) => {
  const count = await Message.countDocuments({
    receiver: req.user._id,
    unread: true
  });

  res.json({ count });
});

// @desc    Get list of unique conversation threads
// @route   GET /api/messages/conversations
// @access  Private
export const getConversations = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.json([]);
  }
  const currentUserId = req.user._id;

  // Find all messages involving the current user
  const messages = await Message.find({
    $or: [
      { sender: currentUserId },
      { receiver: currentUserId }
    ]
  })
  .sort({ createdAt: -1 });

  const conversationMap = new Map();

  for (const msg of messages) {
    const otherUserObjId = msg.sender.toString() === currentUserId.toString() ? msg.receiver : msg.sender;
    const otherUserIdStr = otherUserObjId.toString();

    if (!conversationMap.has(otherUserIdStr)) {
      conversationMap.set(otherUserIdStr, msg);
    }
  }

  const conversations = [];

  for (const [userId, lastMsg] of conversationMap.entries()) {
    const otherUser = await User.findById(userId).select('username displayName avatar trustScore isVerified bio');
    if (otherUser) {
      // Calculate unread messages from this specific user
      const unreadCount = await Message.countDocuments({
        sender: otherUser._id,
        receiver: currentUserId,
        unread: true
      });

      conversations.push({
        id: lastMsg._id,
        user: otherUser,
        lastMsg: lastMsg.text,
        unread: unreadCount > 0,
        unreadCount,
        time: lastMsg.createdAt
      });
    }
  }

  res.json(conversations);
});

