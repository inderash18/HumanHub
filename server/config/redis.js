import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  lazyConnect: true, enableOfflineQueue: false, maxRetriesPerRequest: 1, commandTimeout: 5000
});

redis.on('connect', () => {
    console.log('[Redis] Connected successfully');
});

redis.on('error', (err) => {
    console.error('[Redis] Connection unavailable');
});

export default redis;

