import { Request, Response } from "express";
import { prisma } from "../db";
import { clearAnalyticsCache } from "../redis";

export const logBulkFeeding = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { inventoryId, totalQuantity, cattleCount, notes, date } = req.body;

    if (!inventoryId || !totalQuantity) {
      res.status(400).json({ error: 'Inventory ID and quantity are required' });
      return;
    }

    const feedingDate = date ? new Date(date) : new Date();
    
    // Fetch current inventory price to lock it in the log
    const inventory = await prisma.inventory.findUnique({
      where: { id: Number(inventoryId) },
      select: { costPerUnit: true }
    });
    
    if (!inventory) {
      res.status(404).json({ error: 'Inventory item not found' });
      return;
    }

    // 1. Create Feeding Log
    const log = await prisma.feedingLog.create({
      data: {
        userId,
        inventoryId: Number(inventoryId),
        totalQuantity: Number(totalQuantity),
        cattleCount: Number(cattleCount || 0),
        notes,
        date: feedingDate,
        unitCostAtTime: inventory.costPerUnit
      }
    });

    // 2. Automatically create Inventory Transaction to deduct stock
    await prisma.inventoryTransaction.create({
      data: {
        userId,
        inventoryId: Number(inventoryId),
        type: 'Out',
        quantity: Number(totalQuantity),
        purpose: 'FEEDING',
        unitCostAtTime: inventory.costPerUnit,
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

    // Invalidate analytics cache
    await clearAnalyticsCache(userId);
    
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
