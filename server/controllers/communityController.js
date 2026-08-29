import asyncHandler from '../utils/asyncHandler.js';
import Community from '../models/Community.js';
import CommunityMember from '../models/CommunityMember.js';
import Post from '../models/Post.js';

// @desc    Create new community
// @route   POST /api/communities
// @access  Private
export const createCommunity = asyncHandler(async (req, res) => {
  const { name, slug, description, category, icon, banner } = req.body;

  if (!name || !description) {
    res.status(400);
    throw new Error('Name and description are required');
  }

  const generatedSlug = (slug || name).trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-');
  const existing = await Community.findOne({ slug: generatedSlug });
  if (existing) {
    res.status(400);
    throw new Error('A community with this slug already exists');
  }

  const community = await Community.create({
    name: name.trim(),
    slug: generatedSlug,
    description: description.trim(),
    category: category || 'General',
    icon: icon || '',
    banner: banner || '',
    creator: req.user._id,
    memberCount: 1
  });

  await CommunityMember.create({
    user: req.user._id,
    community: community._id,
    role: 'admin'
  });

  res.status(201).json({
    success: true,
    community: {
      ...community.toObject(),
      isJoined: true
    },
    message: 'Community created successfully'
  });
});

// @desc    Get all communities
// @route   GET /api/communities
// @access  Public (Optional Auth)
export const getCommunities = asyncHandler(async (req, res) => {
  const communities = await Community.find()
    .populate('creator', 'username displayName avatar')
    .sort({ memberCount: -1 });

  let joinedSet = new Set();
  if (req.user) {
    const memberships = await CommunityMember.find({ user: req.user._id });
    memberships.forEach(m => joinedSet.add(m.community.toString()));
  }

  const formatted = communities.map(c => ({
    ...c.toObject(),
    isJoined: joinedSet.has(c._id.toString())
  }));

  res.status(200).json(formatted);
});

// @desc    Get single community by slug
// @route   GET /api/communities/:slug
// @access  Public (Optional Auth)
export const getCommunityBySlug = asyncHandler(async (req, res) => {
  const community = await Community.findOne({ slug: req.params.slug.toLowerCase() })
    .populate('creator', 'username displayName avatar');

  if (!community) {
    res.status(404);
    throw new Error('Community not found');
  }

  let isJoined = false;
  if (req.user) {
    const membership = await CommunityMember.findOne({ user: req.user._id, community: community._id });
    isJoined = !!membership;
  }

  // Fetch real community posts count
  const postCount = await Post.countDocuments({ community: community._id, status: 'published' });

  res.status(200).json({
    ...community.toObject(),
    postCount,
    isJoined
  });
});

// @desc    Join or Leave a community
// @route   POST /api/communities/:slug/join
// @access  Private
export const joinCommunity = asyncHandler(async (req, res) => {
  const community = await Community.findOne({ slug: req.params.slug.toLowerCase() });

  if (!community) {
    res.status(404);
    throw new Error('Community not found');
  }

  const existingMember = await CommunityMember.findOne({ user: req.user._id, community: community._id });
  let isJoined = false;

  if (existingMember) {
    await CommunityMember.deleteOne({ _id: existingMember._id });
    community.memberCount = Math.max(0, (community.memberCount || 0) - 1);
    isJoined = false;
  } else {
    await CommunityMember.create({ user: req.user._id, community: community._id });
    community.memberCount = (community.memberCount || 0) + 1;
    isJoined = true;
  }

  await community.save();

  res.status(200).json({
    success: true,
    isJoined,
    memberCount: community.memberCount,
    message: isJoined ? `Joined c/${community.slug}` : `Left c/${community.slug}`
  });
});
