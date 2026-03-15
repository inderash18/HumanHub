import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import redis from './config/redis.js'; // initialize
import app from './app.js';
import socketHandler from './socket/socketHandler.js';
import './workers/moderationWorker.js'; // Start worker loop

connectDB().then(async () => {
  // Ensure default communities exist for the human tribe
  try {
      const Community = (await import('./models/Community.js')).default;
      const User = (await import('./models/User.js')).default;
      const count = await Community.countDocuments();
      if (count === 0) {
        let admin = await User.findOne({ username: 'dhruvit_system' }) || await User.findOne();
        if (!admin) {
            admin = await User.create({
                username: 'dhruvit_system', email: 'system@dhruvit.com', password: 'password123',
                role: 'admin', trustScore: 1.0, isVerifiedHuman: true
            });
        }
        const defaults = [
            { name: 'Technology', slug: 'technology', description: 'Tech' },
            { name: 'Science', slug: 'science', description: 'Science' },
            { name: 'World News', slug: 'worldnews', description: 'News' },
            { name: 'Creativity', slug: 'creativity', description: 'Art' },
            { name: 'Gaming', slug: 'gaming', description: 'Gaming' }
        ];
        await Community.insertMany(defaults.map(c => ({...c, creator: admin._id, moderators: [admin._id]})));
        console.log('[Server] Default communities seeded.');
      }
  } catch (err) {
      console.error('[Server] Seed failed:', err.message);
  }
});

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
