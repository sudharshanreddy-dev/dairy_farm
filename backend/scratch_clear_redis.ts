import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

async function clear() {
  await client.connect();
  await client.flushAll();
  console.log('Redis cache cleared successfully.');
  await client.disconnect();
}

clear().catch(console.error);
