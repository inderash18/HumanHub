import { corsOrigin } from './config/security.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import commentRoutes from './routes/comments.js';
import communityRoutes from './routes/communities.js';
import userRoutes from './routes/users.js';
import messagesRoutes from './routes/messages.js';
import notificationRoutes from './routes/notifications.js';
import uploadRoutes from './routes/upload.js';
import moderationRoutes from './routes/moderation.js';
import mediaAnalysisRoutes from './routes/mediaAnalysis.js';
import storyRoutes from './routes/stories.js';

import mongoose from 'mongoose';
import redis from './config/redis.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy for IP forwarding behind Render/Vercel/Reverse Proxies
app.set('trust proxy', 1);

// Production-ready security headers via Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "http://localhost:*", "http://127.0.0.1:*"],
      connectSrc: ["'self'", "ws:", "wss:", "https:", "http://localhost:*", "http://127.0.0.1:*"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false
}));

app.use(cors({ origin: corsOrigin, credentials: true }));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Liveness and Readiness endpoints for cloud host probes (Render, Vercel, Uptime monitors)
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'humanhub-backend',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.get(['/ready', '/api/ready'], async (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  const redisReady = redis ? (redis.status === 'ready' || redis.status === 'connect') : false;
  const isHealthy = dbReady; // Core MongoDB is required; Redis queue has native MongoDB queue

  res.status(isHealthy ? 200 : 503).json({
    ready: isHealthy,
    database: dbReady ? 'connected' : 'disconnected',
    queue: redisReady ? 'redis' : 'mongodb_native',
    redis: redis ? (redisReady ? 'connected' : 'disconnected') : 'optional_omitted',
    timestamp: new Date().toISOString()
  });
});

// Apply rate limiting to API
app.use('/api', apiLimiter);

// Authorized media delivery & upload endpoints
app.use('/api/uploads', uploadRoutes);
app.use('/uploads', uploadRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/posts/upload', uploadRoutes);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/moderation', moderationRoutes);

// Image Origin & Provenance Analysis routes
app.use('/api/v1/media', mediaAnalysisRoutes);
app.use('/api/media', mediaAnalysisRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
