import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Community from '../models/Community.js';
import User from '../models/User.js';
import Post from '../models/Post.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const debug = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not set in environment.');
    }

    console.log('[Debug] Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('[Debug] Connected successfully.');

    const [userCount, postCount, communityCount] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Community.countDocuments()
    ]);

    console.log('--- Database Diagnostics ---');
    console.log(`Users count:       ${userCount}`);
    console.log(`Posts count:       ${postCount}`);
    console.log(`Communities count: ${communityCount}`);
    console.log('----------------------------');

    process.exit(0);
  } catch (err) {
    console.error('[Debug Error]', err);
    process.exit(1);
  }
};

debug();
