import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import commentRoutes from './routes/comments.js';
import communityRoutes from './routes/communities.js';
import voteRoutes from './routes/votes.js';
import moderationRoutes from './routes/moderation.js';
import userRoutes from './routes/users.js';
import waitlistRoutes from './routes/waitlist.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.VITE_API_URL || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all requests (could be scoped just to /api)
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/communities', communityRoutes);

// Fix: Merge params setup by mapping directly to dynamic root params
app.use('/api/posts/:postId/vote', (req, res, next) => {
    req.params.id = req.params.postId;
    req.baseUrl = '/api/posts'; // Override for vote controller logic
    next();
}, voteRoutes);
app.use('/api/comments/:commentId/vote', (req, res, next) => {
    req.params.id = req.params.commentId;
    req.baseUrl = '/api/comments';
    next();
}, voteRoutes);

app.use('/api/moderation', moderationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/waitlist', waitlistRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
