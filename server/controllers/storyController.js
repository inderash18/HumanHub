import Story from '../models/Story.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Create a new story
// @route   POST /api/stories
// @access  Private
export const createStory = asyncHandler(async (req, res) => {
  const { mediaUrl, caption } = req.body;

  if (!mediaUrl) {
    res.status(400);
    throw new Error('Media URL is required for a story');
  }

  const story = await Story.create({
    author: req.user._id,
    mediaUrl,
    caption: caption || ''
  });

  // Populate author info before returning
  await story.populate('author', 'username avatar trustScore');

  res.status(201).json({
    message: 'Story created successfully',
    story
  });
});

// @desc    Get all active stories (from past 24 hours)
// @route   GET /api/stories
// @access  Private
export const getStories = asyncHandler(async (req, res) => {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const stories = await Story.find({
    createdAt: { $gte: yesterday }
  })
  .populate('author', 'username avatar trustScore')
  .sort({ createdAt: -1 });

  res.json(stories);
});
