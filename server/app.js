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

// Trust the first proxy (nginx) for correct IP and X-Forwarded headers
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ 
    origin: [
        process.env.FRONTEND_URL || 'http://localhost',
        'http://localhost:3000',
        'http://localhost:3001'
    ], 
    credentials: true 
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

app.get('/bootstrap', async (req, res) => {
    try {
        const Community = (await import('./models/Community.js')).default;
        const User = (await import('./models/User.js')).default;
        
        let systemUser = await User.findOne({ username: 'dhruvit_system' }) || await User.findOne();
        if (!systemUser) {
            systemUser = await User.create({
                username: 'dhruvit_system', email: 'system@dhruvit.com', password: 'password123',
                role: 'admin', trustScore: 1.0, isVerifiedHuman: true
            });
        }

        const defaults = [
            { name: 'Technology', slug: 'technology', description: 'Tech' },
            { name: 'Science', slug: 'science', description: 'Science' },
            { name: 'World News', slug: 'worldnews', description: 'News' },
            { name: 'Creativity', slug: 'creativity', description: 'Art' }
        ];

        for (const c of defaults) {
            await Community.findOneAndUpdate(
                { slug: c.slug },
                { ...c, creator: systemUser._id, moderators: [systemUser._id] },
                { upsert: true }
            );
        }
        res.send('System Bootstrapped.');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.use(notFound);
app.use(errorHandler);

export default app;
