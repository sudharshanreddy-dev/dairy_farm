import { createClient } from 'redis';

async function clearUpstash() {
  const url = "rediss://default:gQAAAAAAAeKWAAIgcDFmZmRlMmNkZGRkZDQ0ZDY0OTJjMjg2YTUxYmQwMzQ0NA@measured-penguin-123542.upstash.io:6379";
  const client = createClient({ url });

  try {
    await client.connect();
    console.log('Connected to Upstash Redis.');
    await client.flushAll();
    console.log('✅ Successfully cleared all cache from Upstash.');
  } catch (err) {
    console.error('Failed to clear Upstash:', err);
  } finally {
    await client.disconnect();
  }
}

clearUpstash();
