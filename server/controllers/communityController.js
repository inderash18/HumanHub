import asyncHandler from '../utils/asyncHandler.js';
import Community from '../models/Community.js';

// @desc    Create new community
// @route   POST /api/communities
// @access  Private
export const createCommunity = asyncHandler(async (req, res) => {
  const { name, slug, description, rules } = req.body;

  if (!name || !slug || !description) {
    res.status(400);
    throw new Error('Name, slug, and description are required');
  }

  const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
  const existing = await Community.findOne({ slug: cleanSlug });
  if (existing) {
    res.status(400);
    throw new Error('Community slug already taken');
  }

  const community = await Community.create({
    name: name.trim(),
    slug: cleanSlug,
    description: description.trim(),
    rules: rules || [],
    creator: req.user._id,
    moderators: [req.user._id],
    members: [req.user._id],
    memberCount: 1
  });

  res.status(201).json(community);
});

// @desc    Get all communities
// @route   GET /api/communities
// @access  Public
export const getCommunities = asyncHandler(async (req, res) => {
  const communities = await Community.find()
    .sort({ memberCount: -1 });

  const formatted = communities.map(c => {
    const isJoined = req.user ? (c.members || []).some(m => m.toString() === req.user._id.toString()) : false;
    return {
      ...c.toObject(),
      memberCount: c.members?.length || c.memberCount || 1,
      isJoined
    };
  });

  res.json(formatted);
});

// @desc    Get community by slug
// @route   GET /api/communities/:slug
// @access  Public (Optional Auth)
export const getCommunityBySlug = asyncHandler(async (req, res) => {
  const community = await Community.findOne({ slug: req.params.slug.toLowerCase() })
    .populate('moderators', 'username displayName avatar');

  if (!community) {
    res.status(404);
    throw new Error('Community not found');
  }

  const isJoined = req.user ? (community.members || []).some(m => m.toString() === req.user._id.toString()) : false;

  res.json({
    ...community.toObject(),
    memberCount: community.members?.length || community.memberCount || 1,
    isJoined
  });
});

// @desc    Join / Leave community toggle
// @route   POST /api/communities/:slug/join
// @access  Private
export const joinCommunity = asyncHandler(async (req, res) => {
  const community = await Community.findOne({ slug: req.params.slug.toLowerCase() });

  if (!community) {
    res.status(404);
    throw new Error('Community not found');
  }

  if (!community.members) community.members = [];

  const userIdStr = req.user._id.toString();
  const isMember = community.members.some(id => id.toString() === userIdStr);

  if (isMember) {
    // Leave community
    community.members = community.members.filter(id => id.toString() !== userIdStr);
  } else {
    // Join community
    community.members.push(req.user._id);
  }

  community.memberCount = community.members.length;
  await community.save();

  res.json({
    success: true,
    isJoined: !isMember,
    memberCount: community.memberCount,
    message: !isMember ? `Joined c/${community.slug}` : `Left c/${community.slug}`
  });
});

// @desc    Update community settings
// @route   PUT /api/communities/:slug
// @access  Private/Moderator
export const updateCommunity = asyncHandler(async (req, res) => {
  const community = await Community.findOne({ slug: req.params.slug.toLowerCase() });

  if (!community) {
    res.status(404);
    throw new Error('Community not found');
  }

  const isMod = community.moderators.some(id => id.toString() === req.user._id.toString()) || req.user.role === 'admin';
  if (!isMod) {
    res.status(403);
    throw new Error('Not authorized to update this community');
  }

  if (req.body.name) community.name = req.body.name.trim();
  if (req.body.description) community.description = req.body.description.trim();
  if (req.body.rules) community.rules = req.body.rules;
  if (req.body.iconUrl) community.iconUrl = req.body.iconUrl;
  if (req.body.bannerUrl) community.bannerUrl = req.body.bannerUrl;

  await community.save();
  res.json(community);
});
