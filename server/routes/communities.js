import express from 'express';
import { 
  createCommunity, 
  getCommunities, 
  getCommunityBySlug, 
  joinCommunity 
} from '../controllers/communityController.js';
import { protect, optionalProtect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(optionalProtect, getCommunities)
  .post(protect, createCommunity);

router.get('/:slug', optionalProtect, getCommunityBySlug);
router.post('/:slug/join', protect, joinCommunity);

export default router;
