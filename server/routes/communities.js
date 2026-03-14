import express from 'express';
import { createCommunity, getCommunities, getCommunityBySlug, updateCommunity, joinCommunity } from '../controllers/communityController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';

const router = express.Router();

router.route('/')
  .get(getCommunities)
  .post(protect, createCommunity);

router.route('/:slug')
  .get(getCommunityBySlug)
  .put(protect, authorize('moderator', 'admin'), updateCommunity);

router.post('/:slug/join', protect, joinCommunity);

export default router;
