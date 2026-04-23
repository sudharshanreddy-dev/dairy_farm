const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const userCount = await prisma.user.count();
    const cattleCount = await prisma.cattle.count();
    const milkCount = await prisma.milkProduction.count();
    const saleCount = await prisma.sale.count();
    
    console.log(`Verification:`);
    console.log(`Users: ${userCount}`);
    console.log(`Cattle: ${cattleCount}`);
    console.log(`Milk Records: ${milkCount}`);
    console.log(`Sales: ${saleCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
