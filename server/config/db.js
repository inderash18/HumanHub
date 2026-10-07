import mongoose from 'mongoose';
import dns from 'node:dns';
import Community from '../models/Community.js';

// Configure public DNS servers to resolve MongoDB Atlas SRV records reliably on Windows/ISP networks
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore DNS setServers error if environment restricts it
}

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/humanhub';
  let conn;

  try {
    conn = await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 4000 });
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
  } catch (primaryErr) {
    console.warn(`[MongoDB] Primary connection failed (${primaryErr.message}). Attempting local fallback...`);
    try {
      conn = await mongoose.connect('mongodb://127.0.0.1:27017/humanhub', { serverSelectionTimeoutMS: 4000 });
      console.log(`[MongoDB] Connected to local fallback: ${conn.connection.host}`);
    } catch (fallbackErr) {
      console.error(`[MongoDB Error] Could not connect to database: ${fallbackErr.message}`);
      process.exit(1);
    }
  }

  // Ensure default communities exist without creating fake/bot users
  try {
    const communityCount = await Community.countDocuments();
    if (communityCount === 0) {
      console.log('[Setup] Initializing default community topics...');
      const systemCreatorId = new mongoose.Types.ObjectId('000000000000000000000001');
      const defaults = [
        { name: 'Technology', slug: 'technology', description: 'Future human innovations and ethical tech.' },
        { name: 'Science', slug: 'science', description: 'Human exploration of the physical universe.' },
        { name: 'World News', slug: 'worldnews', description: 'Global events through a human lens.' },
        { name: 'Creativity', slug: 'creativity', description: 'Art, music, and authentic human expression.' },
        { name: 'Gaming', slug: 'gaming', description: 'Shared digital experiences and human play.' }
      ];

      await Community.insertMany(defaults.map(c => ({
        ...c,
        creator: systemCreatorId,
        rules: ['Be human.', 'No bot spam.', 'Respect authentic ideas.']
      })));
      console.log('[Setup] Default community topics initialized.');
    }
  } catch (commErr) {
    console.warn('[Setup] Community initialization skipped:', commErr.message);
  }
};

export default connectDB;
