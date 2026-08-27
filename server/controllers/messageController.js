import Message from '../models/Message.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Send a new message
// @route   POST /api/messages
// @access  Private
export const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, text } = req.body;

  if (!receiverId || !text) {
    res.status(400);
    throw new Error('Receiver ID and text body are required');
  }

  const message = await Message.create({
    sender: req.user._id,
    receiver: receiverId,
    text
  });

  await message.populate('sender', 'username avatar trustScore');
  await message.populate('receiver', 'username avatar trustScore');

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
  .sort({ createdAt: 1 }); // Oldest first for bubble logging

  // Mark all unread messages received from the other user as read
  await Message.updateMany(
    { sender: otherUserId, receiver: currentUserId, unread: true },
    { $set: { unread: false } }
  );

  res.json(messages);
});

// @desc    Get list of unique conversation threads
// @route   GET /api/messages/conversations/active
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
    const otherUser = await User.findById(userId).select('username avatar trustScore');
    if (otherUser) {
      conversations.push({
        id: lastMsg._id,
        user: otherUser,
        lastMsg: lastMsg.text,
        unread: lastMsg.receiver.toString() === currentUserId.toString() && lastMsg.unread,
        time: lastMsg.createdAt
      });
    }
  }

  res.json(conversations);
});
