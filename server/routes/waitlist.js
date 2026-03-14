import express from 'express';
import { joinWaitlist, getWaitlist } from '../controllers/waitlistController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';

const router = express.Router();

router.route('/')
  .post(joinWaitlist)
  .get(protect, authorize('admin'), getWaitlist);

export default router;
