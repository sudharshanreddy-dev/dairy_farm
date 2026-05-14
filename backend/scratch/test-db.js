const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Attempting to connect to Neon...');
    await prisma.$connect();
    console.log('✅ Successfully connected to Neon PostgreSQL!');
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
    console.log(`Found ${tables.length} tables in the database.`);
    
    if (tables.length === 0) {
      console.log('ℹ️ Note: The database is connected but empty. Remember to run "npx prisma db push" to create your tables.');
    }
  } catch (error) {
    console.error('❌ Failed to connect to the database:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
