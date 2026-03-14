import express from 'express';
import { handleVote } from '../controllers/voteController.js';
import { protect } from '../middleware/auth.js';

// Setup specifically to allow dynamic injection from /posts/:id/vote and /comments/:id/vote
const router = express.Router({ mergeParams: true });

router.post('/', protect, handleVote);

export default router;
