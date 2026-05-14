import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Connected to Redis.');
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
  }
};
export const clearAnalyticsCache = async (userId: number) => {
  try {
    const pattern = `analytics:${userId}:*`;
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`Cleared ${keys.length} analytics cache keys for user ${userId}`);
    }
  } catch (err) {
    console.error('Failed to clear analytics cache:', err);
  }
};
