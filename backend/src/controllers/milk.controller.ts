import { Request, Response } from "express";
import { prisma } from "../db";
import { milkSchema } from '../validators/farm.validator';

export const listMilk = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { cattleId, quality, startDate, endDate, sortBy, order } = req.query;

    const where: any = { userId };
    if (cattleId) where.cattleId = Number(cattleId);
    if (quality) where.quality = quality;
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

    const records = await prisma.milkProduction.findMany({
      where,
      include: { cattle: { select: { name: true, tagNumber: true } } },
      orderBy
    });
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createMilk = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = milkSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const userId = req.user!.userId;
    const { cattleId, date, morningYield, eveningYield, quality, notes } = value;
    
    const record = await prisma.milkProduction.create({
      data: {
        userId,
        cattleId: Number(cattleId),
        date: new Date(date),
        morningYield: Number(morningYield),
        eveningYield: Number(eveningYield),
        totalYield: Number(morningYield) + Number(eveningYield),
        quality,
        notes
      }
    });
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteMilk = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const record = await prisma.milkProduction.findFirst({ where: { id: Number(id), userId } });
    if (!record) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }
    await prisma.milkProduction.delete({ where: { id: Number(id) } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
