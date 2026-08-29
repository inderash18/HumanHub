import mongoose from 'mongoose';
import Community from '../models/Community.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/humanhub');
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);

    // Ensure default communities exist without creating fake/bot users
    const communityCount = await Community.countDocuments();
    if (communityCount === 0) {
      console.log('[Setup] Initializing default community topics...');
      const defaults = [
        { name: 'Technology', slug: 'technology', description: 'Future human innovations and ethical tech.' },
        { name: 'Science', slug: 'science', description: 'Human exploration of the physical universe.' },
        { name: 'World News', slug: 'worldnews', description: 'Global events through a human lens.' },
        { name: 'Creativity', slug: 'creativity', description: 'Art, music, and authentic human expression.' },
        { name: 'Gaming', slug: 'gaming', description: 'Shared digital experiences and human play.' }
      ];

      await Community.insertMany(defaults.map(c => ({
        ...c,
        rules: ['Be human.', 'No bot spam.', 'Respect authentic ideas.']
      })));
      console.log('[Setup] Default community topics initialized.');
    }

  } catch (error) {
    console.error(`[MongoDB Error] ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
