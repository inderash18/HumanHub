import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Community from '../models/Community.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Story from '../models/Story.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const seed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables.');
    }

    console.log('[Seed] Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected successfully.');

    // 1. Create Users
    console.log('[Seed] Seeding verified human users...');
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('password123', salt);

    const usersData = [
      {
        username: 'dhruvit_system',
        email: 'system@dhruvit.com',
        passwordHash: defaultPasswordHash,
        role: 'admin',
        trustScore: 1.0,
        emailVerified: true,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        bio: 'Founder & Lead Architect at HumanHub.'
      },
      {
        username: 'alex_researcher',
        email: 'alex@humanhub.io',
        passwordHash: defaultPasswordHash,
        role: 'moderator',
        trustScore: 0.96,
        emailVerified: true,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        bio: 'Deep learning & AI safety researcher. Exploring the boundaries of human authenticity.'
      },
      {
        username: 'sarah_space',
        email: 'sarah@astronomy.org',
        passwordHash: defaultPasswordHash,
        role: 'user',
        trustScore: 0.94,
        emailVerified: true,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        bio: 'Astrophysics enthusiast. Gazing at stars through James Webb data.'
      },
      {
        username: 'elena_artist',
        email: 'elena@studioart.net',
        passwordHash: defaultPasswordHash,
        role: 'user',
        trustScore: 0.98,
        emailVerified: true,
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        bio: 'Traditional oil & digital artist. 100% human made strokes.'
      },
      {
        username: 'marcus_dev',
        email: 'marcus@codeworks.dev',
        passwordHash: defaultPasswordHash,
        role: 'user',
        trustScore: 0.91,
        emailVerified: true,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        bio: 'Systems engineer & open-source contributor.'
      }
    ];

    const usersMap = {};
    for (const u of usersData) {
      let user = await User.findOne({ username: u.username });
      if (!user) {
        user = await User.create(u);
        console.log(`  + Created user: @${u.username}`);
      } else {
        console.log(`  * User @${u.username} already exists`);
      }
      usersMap[u.username] = user;
    }

    // 2. Create Communities
    console.log('[Seed] Seeding communities...');
    const communitiesData = [
      {
        name: 'Technology',
        slug: 'technology',
        description: 'Discussions on genuine human technological breakthroughs, hardware, and engineering.',
        iconUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=150',
        bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200',
        rules: ['Original human thinking only', 'No raw ChatGPT generated essays', 'Cite credible sources']
      },
      {
        name: 'Science',
        slug: 'science',
        description: 'Physics, biology, astronomy, and the empirical exploration of the universe.',
        iconUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=150',
        bannerUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200',
        rules: ['Peer reviewed research preferred', 'Be respectful and constructive']
      },
      {
        name: 'Creativity',
        slug: 'creativity',
        description: 'Authentic human artistry, photography, storytelling, and craftsmanship.',
        iconUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=150',
        bannerUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200',
        rules: ['Provide work-in-progress if requested', 'Credit original inspirations']
      },
      {
        name: 'Gaming',
        slug: 'gaming',
        description: 'Shared human digital experiences, game mechanics, and esports community.',
        iconUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=150',
        bannerUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200',
        rules: ['No bot scripts or cheats promotion', 'Be a good sport']
      },
      {
        name: 'General',
        slug: 'general',
        description: 'The central town square for verified human thoughts, debates, and casual talk.',
        iconUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=150',
        bannerUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200',
        rules: ['Respect fellow humans', 'Authentic interactions only']
      }
    ];

    const communitiesMap = {};
    for (const c of communitiesData) {
      let community = await Community.findOne({ slug: c.slug });
      if (!community) {
        community = await Community.create({
          ...c,
          creator: usersMap['dhruvit_system']._id,
          moderators: [usersMap['dhruvit_system']._id, usersMap['alex_researcher']._id],
          memberCount: Math.floor(Math.random() * 80) + 20
        });
        console.log(`  + Created community: /c/${c.slug}`);
      } else {
        console.log(`  * Community /c/${c.slug} already exists`);
      }
      communitiesMap[c.slug] = community;
    }

    // 3. Create Posts
    console.log('[Seed] Seeding verified posts...');
    const postsData = [
      {
        title: 'Why Proof of Humanity is the most crucial infrastructure layer of the modern internet',
        body: 'As large language models scale to generate billions of words per second, synthetic engagement is threatening to drown out genuine human discourse. HumanHub was built from the ground up to restore sovereign human spaces with mathematical cryptographic and behavioral verification.',
        authorUsername: 'alex_researcher',
        communitySlug: 'technology',
        mediaUrls: ['https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900'],
        upvotes: 142,
        hotScore: 980.5,
        status: 'published',
        detectionScores: {
          text: { score: 0.04, isAI: false, confidence: 0.98 },
          image: { score: 0.02, isAI: false, confidence: 0.99 },
          bot: { score: 0.05, isBotLikely: false, confidence: 0.97 }
        }
      },
      {
        title: 'James Webb captures new gravitational lens anomaly around cluster MACS J0717',
        body: 'The deep field exposure revealed multiple mirrored arcs of a background galaxy residing at redshift z=4.8. Analyzing the stellar population synthesis shows remarkably early star formation rates.',
        authorUsername: 'sarah_space',
        communitySlug: 'science',
        mediaUrls: ['https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=900'],
        upvotes: 289,
        hotScore: 1250.2,
        status: 'published',
        detectionScores: {
          text: { score: 0.06, isAI: false, confidence: 0.95 },
          image: { score: 0.01, isAI: false, confidence: 0.99 },
          bot: { score: 0.03, isBotLikely: false, confidence: 0.98 }
        }
      },
      {
        title: 'Hand-painted canvas: "Echoes of the Solitary City" (Oil on Linen, 36x48)',
        body: 'Spent the last 4 weeks layering impasto brushstrokes and glaze coats. The play of light during late evening golden hour was captured using warm cadmium yellows and Prussian blue undertones.',
        authorUsername: 'elena_artist',
        communitySlug: 'creativity',
        mediaUrls: ['https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=900'],
        upvotes: 412,
        hotScore: 1890.7,
        status: 'published',
        detectionScores: {
          text: { score: 0.02, isAI: false, confidence: 0.99 },
          image: { score: 0.05, isAI: false, confidence: 0.97 },
          bot: { score: 0.02, isBotLikely: false, confidence: 0.99 }
        }
      },
      {
        title: 'Optimizing Redis queue consumption with Node.js async batching and backpressure',
        body: 'Here is how we lowered latency in our distributed workers by 40% using non-blocking pipeline operations and adaptive exponential polling timers.',
        authorUsername: 'marcus_dev',
        communitySlug: 'technology',
        mediaUrls: ['https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900'],
        upvotes: 95,
        hotScore: 710.0,
        status: 'published',
        detectionScores: {
          text: { score: 0.08, isAI: false, confidence: 0.93 },
          image: { score: 0.01, isAI: false, confidence: 0.99 },
          bot: { score: 0.04, isBotLikely: false, confidence: 0.96 }
        }
      },
      {
        title: 'Welcome to HumanHub: How our multi-layer detection & verification pipeline works',
        body: 'Every post passes through heuristic, neural transformer, and behavioral telemetry checks. Verified human content is immediately pushed to feeds in real time via WebSockets!',
        authorUsername: 'dhruvit_system',
        communitySlug: 'general',
        mediaUrls: ['https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900'],
        upvotes: 560,
        hotScore: 2300.4,
        status: 'published',
        detectionScores: {
          text: { score: 0.01, isAI: false, confidence: 0.99 },
          image: { score: 0.01, isAI: false, confidence: 0.99 },
          bot: { score: 0.01, isBotLikely: false, confidence: 0.99 }
        }
      }
    ];

    const createdPosts = [];
    for (const p of postsData) {
      let existing = await Post.findOne({ title: p.title });
      if (!existing) {
        const post = await Post.create({
          title: p.title,
          body: p.body,
          author: usersMap[p.authorUsername]._id,
          community: communitiesMap[p.communitySlug]._id,
          mediaUrls: p.mediaUrls,
          upvotes: p.upvotes,
          hotScore: p.hotScore,
          status: p.status,
          detectionScores: p.detectionScores
        });
        createdPosts.push(post);
        console.log(`  + Created post: "${p.title.slice(0, 45)}..."`);
      } else {
        createdPosts.push(existing);
        console.log(`  * Post already exists: "${p.title.slice(0, 45)}..."`);
      }
    }

    // 4. Create Comments
    console.log('[Seed] Seeding comments...');
    if (createdPosts.length > 0) {
      const sampleComments = [
        {
          postIndex: 0,
          author: usersMap['marcus_dev']._id,
          body: 'Completely agree. The signal-to-noise ratio on bot-infested feeds is dropping rapidly. Having a verified human-only enclave is refreshing.',
          upvotes: 38
        },
        {
          postIndex: 0,
          author: usersMap['sarah_space']._id,
          body: 'The real-time verification pipeline works seamlessly too. Great engineering on the moderation worker.',
          upvotes: 19
        },
        {
          postIndex: 1,
          author: usersMap['alex_researcher']._id,
          body: 'The early galaxy formation rate at z>4 is defying standard cosmological models. Excited to read the upcoming preprint!',
          upvotes: 44
        },
        {
          postIndex: 2,
          author: usersMap['dhruvit_system']._id,
          body: 'The brushwork texture and lighting in this piece is stunning Elena! Truly exceptional human craftsmanship.',
          upvotes: 52
        }
      ];

      for (const c of sampleComments) {
        const post = createdPosts[c.postIndex];
        if (post) {
          const commentExists = await Comment.findOne({ post: post._id, body: c.body });
          if (!commentExists) {
            await Comment.create({
              body: c.body,
              author: c.author,
              post: post._id,
              upvotes: c.upvotes,
              detectionScores: {
                text: { score: 0.02, isAI: false, confidence: 0.99 },
                bot: { score: 0.01, isBotLikely: false, confidence: 0.99 }
              }
            });
            console.log(`  + Added comment on post: "${post.title.slice(0, 30)}..."`);
          }
        }
      }
    }

    // 5. Create Stories
    console.log('[Seed] Seeding active stories...');
    const storiesData = [
      {
        author: usersMap['elena_artist']._id,
        mediaUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600',
        caption: 'Studio session in progress 🎨'
      },
      {
        author: usersMap['sarah_space']._id,
        mediaUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600',
        caption: 'Observatory night skies 🌌'
      },
      {
        author: usersMap['marcus_dev']._id,
        mediaUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600',
        caption: 'Late night debugging with tea ☕'
      }
    ];

    for (const s of storiesData) {
      const storyExists = await Story.findOne({ author: s.author, caption: s.caption });
      if (!storyExists) {
        await Story.create(s);
        console.log(`  + Created story for user ID ${s.author}`);
      }
    }

    console.log('[Seed] ✅ Complete database seed finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
};

seed();
