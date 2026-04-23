import { Request, Response } from "express";
import { prisma } from "../db";

export const logBulkFeeding = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { inventoryId, totalQuantity, cattleCount, notes, date } = req.body;

    if (!inventoryId || !totalQuantity) {
      res.status(400).json({ error: 'Inventory ID and quantity are required' });
      return;
    }

    const feedingDate = date ? new Date(date) : new Date();

    // 1. Create Feeding Log
    const log = await prisma.feedingLog.create({
      data: {
        userId,
        inventoryId: Number(inventoryId),
        totalQuantity: Number(totalQuantity),
        cattleCount: Number(cattleCount || 0),
        notes,
        date: feedingDate
      }
    });

    // 2. Automatically create Inventory Transaction to deduct stock
    await prisma.inventoryTransaction.create({
      data: {
        userId,
        inventoryId: Number(inventoryId),
        type: 'Out',
        quantity: Number(totalQuantity),
        notes: `Bulk feeding log #${log.id}`,
        date: feedingDate
      }
    });

    // 3. Update Inventory current quantity
    await prisma.inventory.update({
      where: { id: Number(inventoryId) },
      data: {
        quantity: { decrement: Number(totalQuantity) }
      }
    });

    res.status(201).json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const listFeedingLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const logs = await prisma.feedingLog.findMany({
      where: { userId },
      include: { inventory: { select: { itemName: true, unit: true } } },
      orderBy: { date: 'desc' }
    });
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
