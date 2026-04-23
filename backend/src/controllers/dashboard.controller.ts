import { Request, Response } from "express";
import { prisma } from "../db";
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. KPIs
    const totalCattle = await prisma.cattle.count({ where: { userId, status: 'Active' } });
    
    const dayProduction = await prisma.milkProduction.aggregate({
      where: { userId, date: { gte: today } },
      _sum: { totalYield: true }
    });
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthSales = await prisma.sale.aggregate({
      where: { userId, date: { gte: startOfMonth } },
      _sum: { totalAmount: true }
    });

    const unreadAlerts = await prisma.alert.count({ where: { userId, isRead: false } });

    // 2. Charts (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const milkRecords = await prisma.milkProduction.findMany({
      where: { userId, date: { gte: sevenDaysAgo } },
      select: { date: true, totalYield: true }
    });

    const salesRecords = await prisma.sale.findMany({
      where: { userId, date: { gte: sevenDaysAgo } },
      select: { date: true, totalAmount: true }
    });

    // Bucket by day
    const milkStats: { [key: string]: number } = {};
    const salesStats: { [key: string]: number } = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      milkStats[key] = 0;
      salesStats[key] = 0;
    }

    milkRecords.forEach(r => {
      const key = r.date.toISOString().split('T')[0];
      if (milkStats[key] !== undefined) milkStats[key] += r.totalYield;
    });

    salesRecords.forEach(r => {
      const key = r.date.toISOString().split('T')[0];
      if (salesStats[key] !== undefined) salesStats[key] += r.totalAmount;
    });

    // 3. Quality Distribution
    const qualityCounts = await prisma.cattle.groupBy({
      by: ['quality'],
      where: { userId, status: 'Active' },
      _count: { _all: true }
    });

    res.json({
      kpis: {
        totalCattle,
        todayMilk: dayProduction._sum.totalYield || 0,
        monthlyRevenue: monthSales._sum.totalAmount || 0,
        unreadAlerts
      },
      charts: {
        milkTrend: Object.entries(milkStats).map(([date, total]) => ({ date, total })),
        salesTrend: Object.entries(salesStats).map(([date, total]) => ({ date, total }))
      },
      qualityDist: qualityCounts.map(q => ({ label: q.quality, count: q._count._all }))
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
