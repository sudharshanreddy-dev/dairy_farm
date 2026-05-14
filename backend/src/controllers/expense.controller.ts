import { Request, Response } from "express";
import { prisma } from "../db";
import { clearAnalyticsCache } from "../redis";

export const listExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { category, startDate, endDate } = req.query;

    const where: any = { userId };
    if (category) where.category = category as string;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const expenses = await prisma.farmExpense.findMany({
      where,
      orderBy: { date: 'desc' }
    });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { category, amount, date, description } = req.body;

    if (!category || !amount) {
      res.status(400).json({ error: 'Category and amount are required' });
      return;
    }

    const expense = await prisma.farmExpense.create({
      data: {
        userId,
        category: category.toUpperCase() as any,
        amount: Number(amount),
        date: date ? new Date(date) : new Date(),
        description
      }
    });

    // Invalidate analytics cache
    await clearAnalyticsCache(userId);
    
    res.status(201).json(expense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.farmExpense.delete({ where: { id: Number(id), userId: req.user!.userId } });
    
    // Invalidate analytics cache
    await clearAnalyticsCache(req.user!.userId);
    
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
