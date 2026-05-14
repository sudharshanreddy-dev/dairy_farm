import { Client } from 'pg';
import "dotenv/config";

async function check() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  try {
    await client.connect();
    console.log('SUCCESS');
    await client.end();
  } catch (e) {
    console.error('FAILED', e);
  }
}
check();
