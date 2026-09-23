import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import Block from '../models/Block.js';
import Notification from '../models/Notification.js';
import { getIO } from '../socket/socketHandler.js';
import { canMessage } from '../policies/authorization.js';

// @desc    Send a new message
// @route   POST /api/messages
// @access  Private
export const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, recipientId, text, body } = req.body;
  const targetId = receiverId || recipientId;
  const content = (text || body || '').trim();

  if (!targetId || !mongoose.Types.ObjectId.isValid(targetId) || !content) {
    res.status(400);
    throw new Error('Valid recipient ID and message content are required');
  }

  if (content.length > 2000) {
    res.status(400);
    throw new Error('Message length exceeds the 2,000 character limit.');
  }

  const recipient = await User.findById(targetId);
  if (!recipient || recipient.isBanned) {
    res.status(404);
    throw new Error('Recipient user not found');
  }

  // Check bidirectional blocking
  const isBlocked = await Block.isBlocked(req.user._id, targetId);
  if (isBlocked) {
    return res.status(403).json({ message: 'Cannot send message to this user due to privacy/blocking settings.' });
  }

  if (recipient.privacySettings?.allowDirectMessages === false && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'This user is not accepting messages.' });
  }

  // Find or create conversation
  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, targetId] }
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, targetId],
      lastMessage: content.slice(0, 100),
      lastSender: req.user._id,
      lastMessageAt: new Date()
    });
  } else {
    conversation.lastMessage = content.slice(0, 100);
    conversation.lastSender = req.user._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();
  }

  const message = await Message.create({
    conversationId: conversation._id,
    sender: req.user._id,
    recipient: targetId,
    body: content,
    read: false
  });

  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'username displayName avatar')
    .populate('recipient', 'username displayName avatar');

  // Trigger real notification
  await Notification.create({
    recipient: targetId,
    sender: req.user._id,
    type: 'message',
    message: message._id,
    text: 'sent you a message.'
  });

  // Socket realtime dispatch
  try {
    const io = getIO();
    if (io) {
      io.to(`user_${targetId.toString()}`).emit('message:receive', populatedMessage);
      io.to(`user_${req.user._id.toString()}`).emit('message:sent', populatedMessage);
    }
  } catch (err) {
    console.log('[Socket DM Notice]', err.message);
  }

  res.status(201).json(populatedMessage);
});

// @desc    Get message history between current user and target user or conversation
// @route   GET /api/messages/:userId
// @access  Private
export const getMessages = asyncHandler(async (req, res) => {
  const otherUserId = req.params.userId;
  const currentUserId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
    res.status(400);
    throw new Error('Invalid user ID');
  }

  // Check blocking
  const isBlocked = await Block.isBlocked(currentUserId, otherUserId);
  if (isBlocked && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied.' });
  }

  const messages = await Message.find({
    $or: [
      { sender: currentUserId, recipient: otherUserId },
      { sender: otherUserId, recipient: currentUserId }
    ]
  })
  .populate('sender', 'username displayName avatar')
  .populate('recipient', 'username displayName avatar')
  .sort({ createdAt: 1 });

  // Mark incoming unread messages as read
  await Message.updateMany(
    { sender: otherUserId, recipient: currentUserId, read: false },
    { $set: { read: true } }
  );

  res.status(200).json(messages);
});

// @desc    Get list of unique conversation threads
// @route   GET /api/messages/conversations
// @access  Private
export const getConversations = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  const conversations = await Conversation.find({
    participants: currentUserId
  })
  .populate('participants', 'username displayName avatar bio')
  .sort({ lastMessageAt: -1 });

  const formatted = await Promise.all(
    conversations.map(async (conv) => {
      const otherUser = conv.participants.find(p => p && p._id && p._id.toString() !== currentUserId.toString()) || conv.participants[0];
      if (!otherUser) return null;

      const unreadCount = await Message.countDocuments({
        sender: otherUser._id,
        recipient: currentUserId,
        read: false
      });

      return {
        id: conv._id,
        conversationId: conv._id,
        user: otherUser,
        lastMsg: conv.lastMessage,
        time: conv.lastMessageAt,
        unread: unreadCount > 0,
        unreadCount
      };
    })
  );

  res.status(200).json(formatted.filter(Boolean));
});

// @desc    Get total unread messages count
// @route   GET /api/messages/unread-count
// @access  Private
export const getUnreadMessagesCount = asyncHandler(async (req, res) => {
  const count = await Message.countDocuments({
    recipient: req.user._id,
    read: false
  });

  res.status(200).json({ count });
});

