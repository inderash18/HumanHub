import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import redis from './config/redis.js'; // initialize
import app from './app.js';
import socketHandler from './socket/socketHandler.js';
import './workers/moderationWorker.js'; // Start worker loop

connectDB();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
        process.env.FRONTEND_URL || 'http://localhost',
        'http://localhost:3000',
        'http://localhost:3001'
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

socketHandler(io);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`[Server] HumanHub Backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
