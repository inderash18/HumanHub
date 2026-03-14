import asyncHandler from '../utils/asyncHandler.js';
import Community from '../models/Community.js';

// @desc    Create new community
// @route   POST /api/communities
// @access  Private
export const createCommunity = asyncHandler(async (req, res) => {
  const { name, slug, description, rules } = req.body;

  if (req.user.trustScore < 0.5) {
    res.status(403);
    throw new Error('Trust score too low to create communities');
  }

  const existing = await Community.findOne({ slug });
  if (existing) {
    res.status(400);
    throw new Error('Community slug already taken');
  }

  const community = await Community.create({
    name,
    slug,
    description,
    rules: rules || [],
    creator: req.user._id,
    moderators: [req.user._id]
  });

  res.status(201).json(community);
});

// @desc    Get all communities
// @route   GET /api/communities
// @access  Public
export const getCommunities = asyncHandler(async (req, res) => {
  const communities = await Community.find()
    .sort({ memberCount: -1 })
    .limit(50);
  res.json(communities);
});

// @desc    Get community by slug
// @route   GET /api/communities/:slug
// @access  Public
export const getCommunityBySlug = asyncHandler(async (req, res) => {
  const community = await Community.findOne({ slug: req.params.slug })
    .populate('moderators', 'username');

  if (!community) {
    res.status(404);
    throw new Error('Community not found');
  }
  res.json(community);
});

// @desc    Update community settings
// @route   PUT /api/communities/:slug
// @access  Private/Moderator
export const updateCommunity = asyncHandler(async (req, res) => {
   res.status(200).json({ message: "Updated" });
});

// @desc    Join community
// @route   POST /api/communities/:slug/join
// @access  Private
export const joinCommunity = asyncHandler(async (req, res) => {
    res.status(200).json({ message: "Joined" });
});
