import { Request, Response } from "express";
import { prisma } from "../db";

export const listAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const alerts = await prisma.alert.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.alert.update({
      where: { id: Number(id) },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markAllRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    await prisma.alert.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
    res.json({ message: 'All alerts marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Check for new alerts (Inventory expiry, etc.)
export const checkAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // 1. Check Inventory Expiry (Expired or expiring soon)
    const expiringItems = await prisma.inventory.findMany({
      where: {
        userId,
        expiryDate: { lte: thirtyDaysFromNow }
      }
    }) || [];

    for (const item of expiringItems) {
      if (item.expiryDate) {
        const isExpired = item.expiryDate < new Date();
        const message = isExpired 
          ? `Item ${item.itemName} EXPIRED on ${item.expiryDate.toLocaleDateString()}`
          : `Item ${item.itemName} is expiring on ${item.expiryDate.toLocaleDateString()}`;
        
        const existing = await prisma.alert.findFirst({
          where: { userId, type: 'Expiry', relatedId: item.id, isRead: false }
        });
        if (!existing) {
          await prisma.alert.create({
            data: { userId, type: 'Expiry', message, severity: isExpired ? 'High' : 'Warning', relatedId: item.id }
          });
        }
      }
    }

    // 2. Check Low Stock
    const allItems = await prisma.inventory.findMany({ where: { userId } }) || [];
    for (const item of allItems) {
      if (item.quantity <= item.minQuantity) {
        const msg = `Low stock: ${item.itemName} (${item.quantity} ${item.unit || ''} left)`;
        const existing = await prisma.alert.findFirst({
          where: { userId, type: 'Stock', message: msg, isRead: false }
        });
        if (!existing) {
          await prisma.alert.create({
            data: { userId, type: 'Stock', message: msg, severity: 'Warning', relatedId: item.id }
          });
        }
      }
    }

    // 3. Check Upcoming Vaccinations (Next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const dueVaccinations = await prisma.vaccination.findMany({
      where: {
        userId,
        nextDueDate: { lte: sevenDaysFromNow, gte: new Date() }
      },
      include: { cattle: true }
    }) || [];

    for (const v of dueVaccinations) {
      if (v.nextDueDate) {
        const msg = `Vaccination Due: ${v.vaccineName} for ${v.cattle.name || '#' + v.cattle.tagNumber} on ${v.nextDueDate.toLocaleDateString()}`;
        const existing = await prisma.alert.findFirst({
          where: { userId, type: 'Vaccination', relatedId: v.id, isRead: false }
        });
        if (!existing) {
          await prisma.alert.create({
            data: { userId, type: 'Vaccination', message: msg, severity: 'High', relatedId: v.id }
          });
        }
      }
    }

    res.json({ message: 'Alerts checked and generated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
