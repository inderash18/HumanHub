import mongoose from 'mongoose';
import Story from '../models/Story.js';
import User from '../models/User.js';
import Follow from '../models/Follow.js';
import Block from '../models/Block.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import Notification from '../models/Notification.js';
import MediaAnalysis from '../models/MediaAnalysis.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getIO } from '../socket/socketHandler.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';

/**
 * Helper to check whether viewer is authorized to view a given story
 */
const canAccessStory = ({ viewer, story, followedIds = new Set(), blockedIds = new Set() }) => {
  if (!story || !story.author) return false;
  const authorId = story.author._id ? story.author._id.toString() : story.author.toString();

  // If viewer is the author
  if (viewer && viewer._id && viewer._id.toString() === authorId) {
    return true;
  }

  // If viewer or author blocked each other
  if (blockedIds.has(authorId)) {
    return false;
  }

  // Privileged roles can view
  if (viewer && ['admin', 'moderator'].includes(viewer.role)) {
    return true;
  }

  // Private account check
  const isPrivate = Boolean(story.author.privacySettings?.isPrivate);
  if (isPrivate) {
    if (viewer && followedIds.has(authorId)) {
      return true;
    }
    return false;
  }

  // Public story
  return true;
};

// @desc    Create a new story
// @route   POST /api/stories
// @access  Private
export const createStory = asyncHandler(async (req, res) => {
  const { mediaUrl, caption } = req.body;

  if (!mediaUrl || typeof mediaUrl !== 'string' || !mediaUrl.trim()) {
    res.status(400);
    throw new Error('Valid media URL is required for a story');
  }

  const cleanMediaUrl = mediaUrl.trim().split('#')[0];
  const isVideo = /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(cleanMediaUrl);
  const isUploadPath = cleanMediaUrl.startsWith('/api/uploads/') || 
                       cleanMediaUrl.startsWith('/uploads/') ||
                       cleanMediaUrl.startsWith('https://res.cloudinary.com/') ||
                       cleanMediaUrl.includes('cloudinary.com');
  if (!isVideo && isUploadPath && mongoose.connection.readyState === 1) {
    // Enforce MediaAnalysis check for uploaded image stories
    const analysis = await MediaAnalysis.findOne({
      mediaUrl: cleanMediaUrl,
      owner: req.user._id
    }).sort({ mediaVersion: -1 });

    if (!analysis) {
      res.status(400);
      throw new Error(`Unverified story media: "${cleanMediaUrl}". All story images must be verified.`);
    }

    if (String(analysis.owner) !== String(req.user._id)) {
      res.status(403);
      throw new Error('Unauthorized: You do not own this media record.');
    }

    if (analysis.publicationDecision === 'BLOCKED') {
      res.status(403);
      throw new Error(`Story publication blocked: ${analysis.decisionReason || 'AI-generated media detected.'}`);
    }

    if (analysis.publicationDecision === 'HELD_FOR_REVIEW') {
      res.status(403);
      throw new Error(`Story publication held: Image requires review before publishing (${analysis.decisionReason}).`);
    }

    if (analysis.publicationDecision !== 'ALLOWED') {
      res.status(422);
      throw new Error('Media verification is in progress. Please wait before publishing.');
    }
  }

  const mediaObj = req.body.media || {
    url: cleanMediaUrl,
    publicId: req.body.publicId || req.body.public_id || '',
    provider: cleanMediaUrl.includes('cloudinary') ? 'cloudinary' : 'local',
    resourceType: isVideo ? 'video' : 'image',
    format: '',
    bytes: 0,
    width: 0,
    height: 0
  };

  // Authoritative server-side ownership assignment
  const story = await Story.create({
    author: req.user._id,
    media: mediaObj,
    mediaUrl: cleanMediaUrl,
    mediaType: isVideo ? 'video' : 'image',
    caption: typeof caption === 'string' ? caption.trim().slice(0, 200) : '',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });

  await story.populate('author', 'username displayName avatar privacySettings trustScore');

  const storyObj = {
    ...story.toObject(),
    viewsCount: 0,
    hasViewed: false,
    reactionsCount: 0,
    hasReacted: false,
    isOwner: true
  };

  // Broadcast real-time story creation to followers and author
  try {
    const io = getIO();
    if (io) {
      io.emit('story:created', storyObj);
    }
  } catch {}

  res.status(201).json({
    success: true,
    message: 'Story created successfully',
    story: storyObj
  });
});

// @desc    Get active stories grouped by author (and my stories)
// @route   GET /api/stories
// @access  Public / Optional Auth
export const getStories = asyncHandler(async (req, res) => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Query unexpired stories
  const rawStories = await Story.find({
    createdAt: { $gte: yesterday },
    expiresAt: { $gt: now }
  })
  .populate('author', 'username displayName avatar privacySettings trustScore')
  .sort({ createdAt: 1 });

  let followedIds = new Set();
  let blockedIds = new Set();

  if (req.user) {
    const [follows, blocks] = await Promise.all([
      Follow.find({ follower: req.user._id }).select('following'),
      Block.find({
        $or: [{ blocker: req.user._id }, { blocked: req.user._id }]
      })
    ]);

    follows.forEach(f => {
      if (f.following) followedIds.add(f.following.toString());
    });

    blocks.forEach(b => {
      if (b.blocker && b.blocker.toString() !== req.user._id.toString()) {
        blockedIds.add(b.blocker.toString());
      }
      if (b.blocked && b.blocked.toString() !== req.user._id.toString()) {
        blockedIds.add(b.blocked.toString());
      }
    });
  }

  // Filter permitted stories and annotate metadata
  const permittedStories = [];
  const myStories = [];
  const authorGroupsMap = new Map();

  for (const story of rawStories) {
    if (!story.author) continue;

    const permitted = canAccessStory({
      viewer: req.user,
      story,
      followedIds,
      blockedIds
    });

    if (!permitted) continue;

    const authorId = story.author._id.toString();
    const isOwner = req.user ? req.user._id.toString() === authorId : false;
    const hasViewed = req.user
      ? Boolean(story.views?.some(v => v.user && v.user.toString() === req.user._id.toString()))
      : false;
    const hasReacted = req.user
      ? Boolean(story.reactions?.some(r => r.user && r.user.toString() === req.user._id.toString()))
      : false;

    const baseStory = typeof story.toObject === 'function' ? story.toObject() : story;
    const formattedStory = {
      ...baseStory,
      viewsCount: story.views?.length || 0,
      hasViewed,
      reactionsCount: story.reactions?.length || 0,
      hasReacted,
      isOwner
    };

    permittedStories.push(formattedStory);

    if (isOwner) {
      myStories.push(formattedStory);
    } else {
      if (!authorGroupsMap.has(authorId)) {
        authorGroupsMap.set(authorId, {
          author: story.author,
          stories: [],
          hasUnviewed: false,
          latestCreatedAt: story.createdAt
        });
      }
      const group = authorGroupsMap.get(authorId);
      group.stories.push(formattedStory);
      if (!hasViewed) group.hasUnviewed = true;
      if (new Date(story.createdAt) > new Date(group.latestCreatedAt)) {
        group.latestCreatedAt = story.createdAt;
      }
    }
  }

  // Convert map to array and sort by unviewed first, then by latest story
  const storyGroups = Array.from(authorGroupsMap.values()).sort((a, b) => {
    if (a.hasUnviewed !== b.hasUnviewed) {
      return a.hasUnviewed ? -1 : 1;
    }
    return new Date(b.latestCreatedAt) - new Date(a.latestCreatedAt);
  });

  res.json({
    success: true,
    myStories,
    storyGroups,
    stories: permittedStories
  });
});

// @desc    Get current authenticated user's active stories
// @route   GET /api/stories/my
// @access  Private
export const getMyStories = asyncHandler(async (req, res) => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const stories = await Story.find({
    author: req.user._id,
    createdAt: { $gte: yesterday },
    expiresAt: { $gt: now }
  })
  .populate('author', 'username displayName avatar privacySettings trustScore')
  .populate('views.user', 'username displayName avatar')
  .sort({ createdAt: 1 });

  const formatted = stories.map(s => {
    const base = typeof s.toObject === 'function' ? s.toObject() : s;
    return {
      ...base,
      viewsCount: s.views?.length || 0,
      hasViewed: true,
      reactionsCount: s.reactions?.length || 0,
      isOwner: true
    };
  });

  res.json({
    success: true,
    stories: formatted
  });
});

// @desc    Get active stories for a specific user
// @route   GET /api/stories/user/:userId
// @access  Public / Optional Auth
export const getUserStories = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400);
    throw new Error('Invalid user ID');
  }

  const targetUser = await User.findById(userId).select('username displayName avatar privacySettings');
  if (!targetUser) {
    res.status(404);
    throw new Error('User not found');
  }

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Check access permissions
  let isFollowing = false;
  let isBlocked = false;

  if (req.user) {
    [isFollowing, isBlocked] = await Promise.all([
      Follow.exists({ follower: req.user._id, following: userId }),
      Block.isBlocked(req.user._id, userId)
    ]);
  }

  const isOwner = req.user ? req.user._id.toString() === userId.toString() : false;
  const isPrivileged = req.user && ['admin', 'moderator'].includes(req.user.role);

  if (isBlocked && !isPrivileged) {
    return res.status(403).json({ message: 'Access denied to this user stories.' });
  }

  if (targetUser.privacySettings?.isPrivate && !isOwner && !isFollowing && !isPrivileged) {
    return res.status(403).json({ message: 'This account is private.' });
  }

  const stories = await Story.find({
    author: userId,
    createdAt: { $gte: yesterday },
    expiresAt: { $gt: now }
  })
  .populate('author', 'username displayName avatar privacySettings trustScore')
  .sort({ createdAt: 1 });

  const formatted = stories.map(story => {
    const base = typeof story.toObject === 'function' ? story.toObject() : story;
    return {
      ...base,
      viewsCount: story.views?.length || 0,
      hasViewed: req.user ? story.views?.some(v => v.user && v.user.toString() === req.user._id.toString()) : false,
      reactionsCount: story.reactions?.length || 0,
      hasReacted: req.user ? story.reactions?.some(r => r.user && r.user.toString() === req.user._id.toString()) : false,
      isOwner
    };
  });

  res.json({
    success: true,
    author: targetUser,
    stories: formatted
  });
});

// @desc    Delete a story
// @route   DELETE /api/stories/:id
// @access  Private (Owner or Admin/Moderator)
export const deleteStory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid story ID');
  }

  const story = await Story.findById(id);
  if (!story) {
    res.status(404);
    throw new Error('Story not found or already deleted');
  }

  const isOwner = story.author.toString() === req.user._id.toString();
  const isPrivileged = ['admin', 'moderator'].includes(req.user.role);

  if (!isOwner && !isPrivileged) {
    res.status(403);
    throw new Error('Unauthorized: you can only delete your own stories');
  }

  if (story.media && story.media.publicId) {
    deleteFromCloudinary(story.media.publicId, story.media.resourceType || 'image').catch(() => {});
  }

  await Story.findByIdAndDelete(id);

  try {
    const io = getIO();
    if (io) {
      io.emit('story:deleted', { storyId: id, authorId: story.author.toString() });
    }
  } catch {}

  res.json({
    success: true,
    message: 'Story deleted successfully',
    storyId: id
  });
});

// @desc    Record an idempotent view for a story
// @route   POST /api/stories/:id/view
// @access  Private / Optional Auth
export const recordStoryView = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid story ID');
  }

  const story = await Story.findById(id).populate('author', 'privacySettings');
  if (!story) {
    res.status(404);
    throw new Error('Story not found');
  }

  // If expired
  if (story.expiresAt && new Date() > new Date(story.expiresAt)) {
    res.status(410);
    throw new Error('Story has expired');
  }

  if (req.user) {
    const isOwner = story.author._id.toString() === req.user._id.toString();
    
    // Don't duplicate views from the same user (idempotent atomic push)
    const alreadyViewed = story.views?.some(v => v.user && v.user.toString() === req.user._id.toString());
    
    if (!alreadyViewed && !isOwner) {
      await Story.updateOne(
        { _id: id, 'views.user': { $ne: req.user._id } },
        { $push: { views: { user: req.user._id, viewedAt: new Date() } } }
      );
    }
  }

  const updatedStory = await Story.findById(id).select('views');
  res.json({
    success: true,
    viewsCount: updatedStory?.views?.length || 0
  });
});

// @desc    React to a story
// @route   POST /api/stories/:id/react
// @access  Private
export const reactToStory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reaction = 'heart' } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid story ID');
  }

  const story = await Story.findById(id);
  if (!story) {
    res.status(404);
    throw new Error('Story not found');
  }

  // Check if user already reacted
  const existingIndex = story.reactions.findIndex(
    r => r.user && r.user.toString() === req.user._id.toString()
  );

  if (existingIndex > -1) {
    story.reactions[existingIndex].reaction = reaction;
    story.reactions[existingIndex].createdAt = new Date();
  } else {
    story.reactions.push({
      user: req.user._id,
      reaction,
      createdAt: new Date()
    });
  }

  await story.save();

  // Create notification for story author if not self
  if (story.author.toString() !== req.user._id.toString()) {
    try {
      await Notification.create({
        recipient: story.author,
        sender: req.user._id,
        type: 'like',
        post: null,
        message: `${req.user.username} reacted to your story.`
      });
    } catch {}
  }

  res.json({
    success: true,
    reactionsCount: story.reactions.length,
    reaction
  });
});

// @desc    Reply to a story via direct message
// @route   POST /api/stories/:id/reply
// @access  Private
export const replyToStory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid story ID');
  }

  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(400);
    throw new Error('Reply text is required');
  }

  const story = await Story.findById(id).populate('author', 'username privacySettings isBanned');
  if (!story || !story.author) {
    res.status(404);
    throw new Error('Story not found');
  }

  const targetId = story.author._id;

  // Cannot reply to own story
  if (targetId.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('Cannot reply to your own story');
  }

  // Check blocking
  const isBlocked = await Block.isBlocked(req.user._id, targetId);
  if (isBlocked) {
    return res.status(403).json({ message: 'Cannot reply due to blocking settings.' });
  }

  const messageText = `Replied to story: ${text.trim()}`;

  // Find or create conversation
  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, targetId] }
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, targetId],
      lastMessage: messageText.slice(0, 100),
      lastSender: req.user._id,
      lastMessageAt: new Date()
    });
  } else {
    conversation.lastMessage = messageText.slice(0, 100);
    conversation.lastSender = req.user._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    recipient: targetId,
    content: messageText,
    mediaUrl: story.mediaUrl
  });

  await message.populate('sender', 'username displayName avatar');

  try {
    const io = getIO();
    if (io) {
      io.to(targetId.toString()).emit('message:new', message);
    }
  } catch {}

  res.status(201).json({
    success: true,
    message: 'Reply sent successfully',
    reply: message
  });
});
