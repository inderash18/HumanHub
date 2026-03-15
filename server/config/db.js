import mongoose from 'mongoose';
import Community from '../models/Community.js';
import User from '../models/User.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/humanhub');
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);

    // Auto-seed communities if empty
    const communityCount = await Community.countDocuments();
    if (communityCount === 0) {
      console.log('[Seed] No communities found. Initializing defaults...');
      
      // Ensure we have a system user/creator
      let systemUser = await User.findOne({ username: 'dhruvit_system' });
      if (!systemUser) {
        systemUser = await User.create({
          username: 'dhruvit_system',
          email: 'system@dhruvit.com',
          password: 'system_default_password_2026',
          trustScore: 1.0,
          role: 'admin',
          isVerifiedHuman: true
        });
      }

      const defaults = [
        { name: 'Technology', slug: 'technology', description: 'Future human innovations and ethical tech.' },
        { name: 'Science', slug: 'science', description: 'Human exploration of the physical universe.' },
        { name: 'World News', slug: 'worldnews', description: 'Global events through a human lens.' },
        { name: 'Creativity', slug: 'creativity', description: 'Art, music, and authentic human expression.' },
        { name: 'Gaming', slug: 'gaming', description: 'Shared digital experiences and human play.' }
      ];

      await Community.insertMany(defaults.map(c => ({
        ...c,
        creator: systemUser._id,
        moderators: [systemUser._id],
        rules: ['Be human.', 'No bot spam.', 'Respect authentic ideas.']
      })));
      
      console.log('[Seed] Default communities created successfully.');
    }

  } catch (error) {
    console.error(`[MongoDB Error] ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
