import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Community from './models/Community.js';
import User from './models/User.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find any user to be the temporary creator
    let user = await User.findOne();
    if (!user) {
      console.log('No users found. Creating a system user...');
      user = await User.create({
        username: 'dhruvit_system',
        email: 'system@dhruvit.com',
        password: 'system_root_password',
        trustScore: 1.0
      });
    }

    const communities = [
      { name: 'Technology', slug: 'technology', description: 'Future human innovations.' },
      { name: 'Science', slug: 'science', description: 'Human exploration of the universe.' },
      { name: 'Creativity', slug: 'creativity', description: 'Art and authentic human expression.' },
      { name: 'Gaming', slug: 'gaming', description: 'Shared human digital experiences.' },
      { name: 'General', slug: 'general', description: 'General human discussions.' },
    ];

    for (const c of communities) {
      const exists = await Community.findOne({ slug: c.slug });
      if (!exists) {
        await Community.create({
          ...c,
          creator: user._id,
          moderators: [user._id]
        });
        console.log(`Created community: ${c.slug}`);
      }
    }

    console.log('Seed completed successfully');
    process.exit();
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

seed();
