import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function check() {
  const pool = new Pool({ connectionString: "postgresql://postgres:postgres@localhost:5432/dairy_farm?schema=public" });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as any);

  const user = await prisma.user.findUnique({ where: { username: 'ravi_farmer' } });
  if (!user) {
    console.log('User not found');
    return;
  }

  const userId = user.id;
  const start = new Date(new Date().setDate(new Date().getDate() - 30));
  const end = new Date();
  start.setHours(0,0,0,0);
  end.setHours(23,59,59,999);

  const sales = await prisma.sale.aggregate({
    where: { userId, date: { gte: start, lte: end } },
    _sum: { totalAmount: true }
  });

  const farmExpenses = await prisma.farmExpense.aggregate({
    where: { userId, date: { gte: start, lte: end } },
    _sum: { amount: true }
  });

  const feedingLogs = await prisma.feedingLog.findMany({
    where: { userId, date: { gte: start, lte: end } }
  });
  const fCost = feedingLogs.reduce((acc: any, log: any) => acc + (log.totalQuantity * log.unitCostAtTime), 0);

  const health = await prisma.healthRecord.aggregate({
    where: { userId, date: { gte: start, lte: end } },
    _sum: { cost: true }
  });

  const vax = await prisma.vaccination.aggregate({
    where: { userId, dateGiven: { gte: start, lte: end } },
    _sum: { cost: true }
  });

  console.log('--- RAVI FARMER CHECK ---');
  console.log('Revenue:', sales._sum.totalAmount);
  console.log('Farm Operating Expenses:', farmExpenses._sum.amount);
  console.log('Feeding Costs:', fCost);
  console.log('Health Costs:', health._sum.cost);
  console.log('Vaccination Costs:', vax._sum.cost);
  console.log('Total Expenses:', (sales._sum.totalAmount || 0) - ((farmExpenses._sum.amount || 0) + fCost + (health._sum.cost || 0) + (vax._sum.cost || 0)));

  await prisma.$disconnect();
}

check();
