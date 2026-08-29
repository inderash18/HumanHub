import express from 'express';
import { handleVote } from '../controllers/voteController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.post('/', protect, handleVote);
router.post('/:id', protect, handleVote);

export default router;

