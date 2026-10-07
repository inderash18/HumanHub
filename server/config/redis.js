import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

let redis = null;

if (process.env.REDIS_URL && process.env.REDIS_URL.trim() !== '') {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      commandTimeout: 5000
    });

    redis.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });

    redis.on('error', (err) => {
      // Suppress unhandled error crashes; system operates with MongoDB-native queue
    });
  } catch (err) {
    redis = null;
  }
}

export default redis;

