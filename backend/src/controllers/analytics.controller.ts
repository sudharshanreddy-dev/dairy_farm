import { Request, Response } from "express";
import { prisma } from "../db";
import { redisClient } from "../redis";

export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { start_date, end_date } = req.query as { start_date?: string; end_date?: string };

    const start = start_date ? new Date(start_date) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = end_date ? new Date(end_date) : new Date();

    const cacheKey = `analytics:${userId}:${start.getTime()}:${end.getTime()}`;

    // Attempt to retrieve from cache
    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log('Serving analytics from Redis cache');
        res.json(JSON.parse(cachedData));
        return;
      }
    } catch (cacheErr) {
      console.warn('Redis cache read error:', cacheErr);
    }

    // 1. Revenue
    const sales = await prisma.sale.aggregate({
      where: { userId, date: { gte: start, lte: end } },
      _sum: { totalAmount: true }
    });
    const revenue = sales._sum.totalAmount || 0;

    // 2. Production
    const totalProduction = await prisma.milkProduction.aggregate({
      where: { userId, date: { gte: start, lte: end } },
      _sum: { totalYield: true }
    });
    const totalYield = totalProduction._sum.totalYield || 0;

    // 3. Detailed Expenses
    const healthCosts = await prisma.healthRecord.aggregate({
      where: { userId, date: { gte: start, lte: end } },
      _sum: { cost: true }
    });
    const hCost = healthCosts._sum.cost || 0;

    const vaxCosts = await prisma.vaccination.aggregate({
      where: { userId, dateGiven: { gte: start, lte: end } },
      _sum: { cost: true }
    });
    const vCost = vaxCosts._sum.cost || 0;

    const cattleCosts = await prisma.cattle.aggregate({
      where: { userId, purchaseDate: { gte: start, lte: end } },
      _sum: { purchasePrice: true }
    });
    const cCost = cattleCosts._sum.purchasePrice || 0;

    const feedingLogs = await prisma.feedingLog.findMany({
      where: { userId, date: { gte: start, lte: end } },
      include: { inventory: { select: { costPerUnit: true } } }
    });
    const fCost = feedingLogs.reduce((acc: number, log: any) => acc + (log.totalQuantity * log.inventory.costPerUnit), 0);

    const totalExpenses = hCost + vCost + cCost + fCost;
    const netProfit = revenue - totalExpenses;

    const expenseBreakdown = [
      { label: 'Feed', value: fCost, color: '#FFD700' },
      { label: 'Medical', value: hCost, color: '#FF6B6B' },
      { label: 'Vaccination', value: vCost, color: '#4ECDC4' },
      { label: 'Cattle Purchase', value: cCost, color: '#45B7D1' }
    ];

    // Efficiency Metrics
    const costPerLiter = totalYield > 0 ? (totalExpenses / totalYield) : 0;
    const feedEfficiency = totalYield > 0 ? (fCost / totalYield) : 0;

    // 4. Inventory Valuation (Asset Value)
    const allInventory = await prisma.inventory.findMany({ where: { userId } });
    const inventoryValue = allInventory.reduce((acc: number, item: any) => acc + (item.quantity * item.costPerUnit), 0);

    // 5. Production Chart Data (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const milkRecords = await prisma.milkProduction.findMany({
      where: { userId, date: { gte: sixMonthsAgo } },
      select: { date: true, totalYield: true }
    });

    const monthlyProd: { [key: string]: number } = {};
    milkRecords.forEach((r: any) => {
      const month = r.date.toISOString().substring(0, 7);
      monthlyProd[month] = (monthlyProd[month] || 0) + r.totalYield;
    });

    // 6. Monthly Revenue Trend (Last 6 months)
    const salesHistory = await prisma.sale.findMany({
      where: { userId, date: { gte: sixMonthsAgo } },
      select: { date: true, totalAmount: true }
    });
    const monthlyRev: { [key: string]: number } = {};
    salesHistory.forEach((s: any) => {
      const month = s.date.toISOString().substring(0, 7);
      monthlyRev[month] = (monthlyRev[month] || 0) + s.totalAmount;
    });

    // 7. Top Cattle (Production)
    const topProducers = await prisma.milkProduction.groupBy({
      by: ['cattleId'],
      where: { userId, date: { gte: start, lte: end } },
      _sum: { totalYield: true },
      orderBy: { _sum: { totalYield: 'desc' } },
      take: 5
    });
    const topCattle = await Promise.all(topProducers.map(async p => {
      const c = await prisma.cattle.findUnique({ where: { id: p.cattleId }, select: { name: true, tagNumber: true } });
      return { name: c?.name || c?.tagNumber || 'Unknown', total: p._sum.totalYield || 0 };
    }));

    const result = {
      revenue,
      totalExpenses,
      netProfit,
      costPerLiter,
      feedEfficiency,
      expenseBreakdown,
      inventoryValue,
      totalYield,
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
      productionData: Object.entries(monthlyProd).map(([month, total]) => ({ month, total })).sort((a,b) => a.month.localeCompare(b.month)),
      revenueTrend: Object.entries(monthlyRev).map(([month, total]) => ({ month, total })).sort((a,b) => a.month.localeCompare(b.month)),
      topCattle
    };

    // Store in cache for 1 hour
    try {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(result));
    } catch (cacheErr) {
      console.warn('Redis cache write error:', cacheErr);
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
