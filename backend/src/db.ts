import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

// Optional: check connection on startup
prisma.$connect()
  .then(() => console.log('Connected to PostgreSQL via Prisma.'))
  .catch(err => console.error('Failed to connect to PostgreSQL:', err));
