import { corsOrigin, jwtSecret } from './config/security.js';
import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import redis from './config/redis.js'; // initialize
import app from './app.js';
import socketHandler from './socket/socketHandler.js';
import { startWorker } from './workers/moderationWorker.js'; // Start moderation worker loop
import { startMediaAnalysisWorker } from './workers/mediaAnalysisWorker.js'; // Start image origin analysis worker

import { isCloudinaryActive } from './config/cloudinary.js';

jwtSecret();
await connectDB();
if (redis) {
  redis.connect().catch(() => console.log('[Redis] Optional Redis queue unavailable; using MongoDB fallback.'));
} else {
  console.log('[Queue] Running with MongoDB-native atomic queue (No Redis dependency required).');
}

if (isCloudinaryActive()) {
  console.log(`[Storage] Cloudinary media uploads active (Cloud: ${process.env.CLOUDINARY_CLOUD_NAME}).`);
} else {
  console.warn('[Storage] WARNING: Cloudinary environment variables missing. Falling back to local disk storage.');
}

if (process.env.AI_SERVICE_URL) {
  console.log(`[AI Detection] Connected to AI Service at ${process.env.AI_SERVICE_URL}`);
} else {
  console.log('[AI Detection] Free deployment mode: AI service not configured. Media will be held for manual review.');
}

startWorker();
startMediaAnalysisWorker();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: corsOrigin, credentials: true },
  allowRequest: (req, callback) => corsOrigin(req.headers.origin, callback)
});

socketHandler(io);

const PORT = process.env.PORT || 5000;

const server = httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] HumanHub Backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Graceful shutdown handling for cloud orchestrators (Render, Docker, Kubernetes)
async function gracefulShutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('[Server] HTTP/WebSocket server closed.');
    try {
      io.close();
      if (redis) {
        await redis.quit().catch(() => {});
      }
      const mongoose = (await import('mongoose')).default;
      await mongoose.connection.close(false);
      console.log('[Server] Database connections closed safely.');
      process.exit(0);
    } catch (err) {
      console.error('[Server] Error during shutdown cleanup:', err.message);
      process.exit(1);
    }
  });

  // Force shutdown if cleanup hangs
  setTimeout(() => {
    console.error('[Server] Forced shutdown timeout expired. Exiting.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { httpServer, server };
export default server;
