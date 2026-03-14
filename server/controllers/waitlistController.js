import asyncHandler from '../utils/asyncHandler.js';
import Waitlist from '../models/Waitlist.js';

// @desc    Join waitlist
// @route   POST /api/waitlist
// @access  Public
export const joinWaitlist = asyncHandler(async (req, res) => {
  const { email, name, type, message } = req.body;

  const exists = await Waitlist.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error('You are already on the waitlist! We will be in touch soon.');
  }

  const signup = await Waitlist.create({
    email,
    name,
    type,
    message
  });

  res.status(201).json({
    message: 'Welcome to the HumanHub waitlist.',
    count: await Waitlist.countDocuments() // Dynamic count returns
  });
});

// @desc    Get waitlist pool
// @route   GET /api/waitlist
// @access  Private/Admin
export const getWaitlist = asyncHandler(async (req, res) => {
  const list = await Waitlist.find().sort({ createdAt: -1 });
  res.json(list);
});
