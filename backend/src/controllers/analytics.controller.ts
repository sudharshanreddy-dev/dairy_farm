import { Request, Response } from "express";
import { prisma } from "../db";
import { redisClient } from "../redis";

export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { start_date, end_date } = req.query as { start_date?: string; end_date?: string };

    const start = start_date ? new Date(start_date) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = end_date ? new Date(end_date) : new Date();
    
    // Set start to beginning of day, end to end of day for full coverage
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const cacheKey = `analytics:${userId}:${start.getTime()}:${end.getTime()}`;

    // Attempt to retrieve from cache with a 500ms timeout
    try {
      if (redisClient.isOpen) {
        // Race the redis get against a 500ms timeout
        const cachedData = await Promise.race([
          redisClient.get(cacheKey),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Redis Timeout')), 500))
        ]);

        if (cachedData) {
          console.log('Serving analytics from Redis cache');
          res.json(JSON.parse(cachedData));
          return;
        }
      }
    } catch (cacheErr) {
      console.warn('Redis cache read skipped:', cacheErr.message || cacheErr);
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

    // General Operating Expenses (Labour, Electricity, etc.)
    const farmExpenses = await prisma.farmExpense.aggregate({
      where: { userId, date: { gte: start, lte: end } },
      _sum: { amount: true }
    });
    const gCost = farmExpenses._sum.amount || 0;

    const feedingLogs = await prisma.feedingLog.findMany({
      where: { userId, date: { gte: start, lte: end } },
      include: { inventory: { select: { costPerUnit: true } } }
    });
    // Use historical price (unitCostAtTime is now required in schema)
    const fCost = feedingLogs.reduce((acc: number, log: any) => 
      acc + (log.totalQuantity * (log.unitCostAtTime || log.inventory.costPerUnit)), 0);

    // 4. Manual Inventory Deductions (Wastage) - Reliable filtering using purpose enum
    const adjustments = await prisma.inventoryTransaction.findMany({
      where: { 
        userId, 
        type: 'Out', 
        purpose: 'WASTAGE',
        date: { gte: start, lte: end }
      },
      include: { inventory: { select: { costPerUnit: true } } }
    });
    // Use historical unitCostAtTime if available for transactions
    const aCost = adjustments.reduce((acc: number, tx: any) => 
      acc + (tx.quantity * (tx.unitCostAtTime || tx.inventory.costPerUnit)), 0);

    const totalExpenses = hCost + vCost + fCost + aCost + gCost; 
    const netProfit = revenue - totalExpenses;

    const expenseBreakdown = [
      { label: 'Feed', value: fCost, color: '#FFD700' },
      { label: 'Medical', value: hCost, color: '#FF6B6B' },
      { label: 'Vaccination', value: vCost, color: '#4ECDC4' },
      { label: 'Operating', value: gCost, color: '#bc8cff' }, 
      { label: 'Wastage', value: aCost, color: '#FFA500' }
    ];

    // Efficiency Metrics
    const totalOperatingCost = totalExpenses;
    const costPerLiter = totalYield > 0 ? (totalOperatingCost / totalYield) : 0;
    const feedEfficiency = totalYield > 0 ? (fCost / totalYield) : 0;

    // 4. Inventory Valuation (Asset Value)
    const allInventory = await prisma.inventory.findMany({ where: { userId } });
    const inventoryValue = allInventory.reduce((acc: number, item: any) => acc + (item.quantity * item.costPerUnit), 0);

    // 5. Production Chart Data
    const milkRecords = await prisma.milkProduction.findMany({
      where: { userId, date: { gte: start, lte: end } },
      select: { date: true, totalYield: true }
    });

    const monthlyProd: { [key: string]: number } = {};
    milkRecords.forEach((r: any) => {
      const month = r.date.toISOString().substring(0, 7);
      monthlyProd[month] = (monthlyProd[month] || 0) + r.totalYield;
    });

    // 6. Monthly Revenue Trend
    const salesHistory = await prisma.sale.findMany({
      where: { userId, date: { gte: start, lte: end } },
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
      if (redisClient.isOpen) {
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(result));
      }
    } catch (cacheErr) {
      console.warn('Redis cache write error:', cacheErr);
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
