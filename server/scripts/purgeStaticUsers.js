import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const realUsernames = ['inderash', 'inderash10'];

async function purgeDb(uri, label) {
  console.log(`\n========================================`);
  console.log(`[Purge] Connecting to ${label} (${uri})...`);
  try {
    const conn = await mongoose.createConnection(uri).asPromise();
    const db = conn.db;

    // Find all users except the genuine accounts
    const usersToDelete = await db.collection('users').find({
      username: { $nin: realUsernames }
    }).toArray();

    const userIdsToDelete = usersToDelete.map(u => u._id);
    console.log(`Found ${userIdsToDelete.length} static/test users in ${label} to remove.`);
    usersToDelete.forEach(u => console.log(` - Purging: @${u.username} (${u.email})`));

    if (userIdsToDelete.length > 0) {
      const userDel = await db.collection('users').deleteMany({
        _id: { $in: userIdsToDelete }
      });
      console.log(`Deleted ${userDel.deletedCount} user documents.`);

      const postDel = await db.collection('posts').deleteMany({
        author: { $in: userIdsToDelete }
      });
      console.log(`Deleted ${postDel.deletedCount} orphaned posts.`);

      const commentDel = await db.collection('comments').deleteMany({
        author: { $in: userIdsToDelete }
      });
      console.log(`Deleted ${commentDel.deletedCount} orphaned comments.`);

      const notifDel = await db.collection('notifications').deleteMany({
        $or: [
          { recipient: { $in: userIdsToDelete } },
          { sender: { $in: userIdsToDelete } }
        ]
      });
      console.log(`Deleted ${notifDel.deletedCount} notifications.`);

      const msgDel = await db.collection('messages').deleteMany({
        $or: [
          { sender: { $in: userIdsToDelete } },
          { receiver: { $in: userIdsToDelete } }
        ]
      });
      console.log(`Deleted ${msgDel.deletedCount} messages.`);

      const storyDel = await db.collection('stories').deleteMany({
        author: { $in: userIdsToDelete }
      });
      console.log(`Deleted ${storyDel.deletedCount} stories.`);

      // Clean followers/following on real users
      const remainingUsers = await db.collection('users').find({}).toArray();
      for (const u of remainingUsers) {
        const cleanFollowers = (u.followers || []).filter(id => !userIdsToDelete.some(delId => delId.equals(id)));
        const cleanFollowing = (u.following || []).filter(id => !userIdsToDelete.some(delId => delId.equals(id)));
        await db.collection('users').updateOne(
          { _id: u._id },
          { 
            $set: { 
              followers: cleanFollowers, 
              following: cleanFollowing 
            } 
          }
        );
      }
    }

    const finalUsers = await db.collection('users').find({}).toArray();
    console.log(`\nRemaining Genuine Users in ${label}:`);
    finalUsers.forEach(u => console.log(` - User: @${u.username} (${u.email})`));

    const finalPosts = await db.collection('posts').find({}).toArray();
    console.log(`Remaining Genuine Posts in ${label}: ${finalPosts.length}`);
    finalPosts.forEach(p => console.log(` - Post: "${p.title}" by author ID ${p.author}`));

    await conn.close();
  } catch (err) {
    console.error(`[Error purging ${label}]:`, err.message);
  }
}

async function run() {
  // 1. Purge Local Docker MongoDB
  await purgeDb('mongodb://localhost:27017/humanhub', 'Local Docker MongoDB');

  // 2. Purge Atlas MongoDB
  if (process.env.MONGODB_URI) {
    await purgeDb(process.env.MONGODB_URI, 'MongoDB Atlas');
  }

  console.log('\n[Purge Complete] All static, test, and dummy users have been permanently wiped.');
}

run();
