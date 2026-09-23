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

jwtSecret();
await connectDB();
redis.connect().catch(() => console.error('[Redis] Moderation queue unavailable'));
startWorker();
startMediaAnalysisWorker();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: corsOrigin, credentials: true },
  allowRequest: (req, callback) => corsOrigin(req.headers.origin, callback)
});

socketHandler(io);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`[Server] HumanHub Backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
