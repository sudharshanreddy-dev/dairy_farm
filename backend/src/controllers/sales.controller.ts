import { Request, Response } from "express";
import { prisma } from "../db";
import { saleSchema } from '../validators/farm.validator';

export const listSales = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { paymentStatus, buyerName, startDate, endDate, sortBy, order } = req.query;

    const where: any = { userId };
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (buyerName) where.buyerName = { contains: buyerName as string, mode: 'insensitive' };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy as string] = order === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.date = 'desc';
    }

    const records = await prisma.sale.findMany({
      where,
      orderBy
    });
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = saleSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const { date, buyerName, quantityLiters, pricePerLiter, totalAmount, paymentStatus, notes } = value;
    const record = await prisma.sale.create({
      data: {
        userId: req.user!.userId,
        date: new Date(date),
        buyerName,
        quantityLiters: Number(quantityLiters),
        pricePerLiter: Number(pricePerLiter),
        totalAmount: Number(totalAmount) || (Number(quantityLiters) * Number(pricePerLiter)),
        paymentStatus,
        notes
      }
    });
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.sale.delete({ where: { id: Number(id), userId: req.user!.userId } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
