import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const clearDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not set in environment.');
    }

    console.log('[Database] Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('[Database] Connected successfully.');

    const collections = await mongoose.connection.db.collections();
    console.log(`[Database] Found ${collections.length} collections. Dropping all static data...`);

    for (const collection of collections) {
      await collection.drop();
      console.log(`  - Dropped collection: ${collection.collectionName}`);
    }

    console.log('[Database] ✅ All data cleared. Starting fresh from scratch!');
    process.exit(0);
  } catch (err) {
    console.error('[Database Clear Error]', err);
    process.exit(1);
  }
};

clearDatabase();
