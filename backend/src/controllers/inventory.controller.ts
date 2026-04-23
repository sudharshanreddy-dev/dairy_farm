import { Request, Response } from "express";
import { prisma } from "../db";
import { inventorySchema } from '../validators/farm.validator';
import { NotificationService } from "../services/notification.service";

export const listInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    const items = await prisma.inventory.findMany({
      where: { userId: req.user!.userId },
      orderBy: { itemName: 'asc' }
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = inventorySchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const userId = req.user!.userId;
    const item = await prisma.inventory.create({
      data: {
        ...value,
        userId,
        quantity: Number(value.quantity),
        minQuantity: Number(value.minQuantity),
        costPerUnit: Number(value.costPerUnit),
        lastRestocked: value.lastRestocked ? new Date(value.lastRestocked) : new Date(),
        expiryDate: value.expiryDate ? new Date(value.expiryDate) : null
      }
    });

    // Log initial stock as transaction
    await prisma.inventoryTransaction.create({
      data: {
        userId,
        inventoryId: item.id,
        type: 'In',
        quantity: item.quantity,
        notes: 'Initial stock'
      }
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const oldItem = await prisma.inventory.findUnique({ where: { id: Number(id) } });

    const item = await prisma.inventory.update({
      where: { id: Number(id) },
      data: {
        ...req.body,
        quantity: req.body.quantity !== undefined ? Number(req.body.quantity) : undefined,
        minQuantity: req.body.minQuantity !== undefined ? Number(req.body.minQuantity) : undefined,
        costPerUnit: req.body.costPerUnit !== undefined ? Number(req.body.costPerUnit) : undefined,
        lastRestocked: req.body.lastRestocked ? new Date(req.body.lastRestocked) : undefined,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined
      }
    });

    // Log transaction if quantity changed
    if (req.body.quantity !== undefined && oldItem && oldItem.quantity !== item.quantity) {
      const diff = item.quantity - oldItem.quantity;
      await prisma.inventoryTransaction.create({
        data: {
          userId,
          inventoryId: item.id,
          type: diff > 0 ? 'In' : 'Out',
          quantity: Math.abs(diff),
          notes: req.body.notes || 'Manual update'
        }
      });

      // Check for low stock alert (Chapter 8 & 10 claim)
      if (item.quantity <= item.minQuantity && (oldItem.quantity > oldItem.minQuantity || diff < 0)) {
        await NotificationService.sendNotification(
          userId,
          'Low Stock Alert',
          `Item "${item.itemName}" is running low (${item.quantity} ${item.unit} remaining).`,
          'LOW_STOCK'
        );
      }
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const listTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { inventoryId } = req.params;
    const transactions = await prisma.inventoryTransaction.findMany({
      where: { userId: req.user!.userId, inventoryId: Number(inventoryId) },
      orderBy: { createdAt: 'desc' }
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.inventory.delete({ where: { id: Number(id), userId: req.user!.userId } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
