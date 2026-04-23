import { Request, Response } from "express";
import { prisma } from "../db";
import { healthSchema } from '../validators/farm.validator';
import Joi from 'joi';
import { NotificationService } from "../services/notification.service";

const vaccinationSchema = Joi.object({
  cattleId: Joi.number().required(),
  vaccineName: Joi.string().required(),
  dateGiven: Joi.date().iso().required(),
  nextDueDate: Joi.date().iso().allow(null),
  administeredBy: Joi.string().allow('', null),
  cost: Joi.number().min(0).default(0),
  notes: Joi.string().allow('', null)
});

// Health Records
export const listHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const records = await prisma.healthRecord.findMany({
      where: { userId: req.user!.userId },
      include: { cattle: { select: { name: true, tagNumber: true } } },
      orderBy: { date: 'desc' }
    });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = healthSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const record = await prisma.healthRecord.create({
      data: { 
        ...value, 
        userId: req.user!.userId, 
        date: new Date(value.date), 
        cost: Number(value.cost) 
      }
    });
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Vaccinations
export const listVaccinations = async (req: Request, res: Response): Promise<void> => {
  try {
    const records = await prisma.vaccination.findMany({
      where: { userId: req.user!.userId },
      include: { cattle: { select: { name: true, tagNumber: true } } },
      orderBy: { dateGiven: 'desc' }
    });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createVaccination = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = vaccinationSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const userId = req.user!.userId;
    const record = await prisma.vaccination.create({
      data: { 
        ...value, 
        userId, 
        dateGiven: new Date(value.dateGiven),
        nextDueDate: value.nextDueDate ? new Date(value.nextDueDate) : null,
        cost: Number(value.cost) 
      },
      include: { cattle: { select: { name: true, tagNumber: true } } }
    });

    // Notify about scheduled next dose (Chapter 10 claim)
    if (record.nextDueDate) {
      await NotificationService.sendNotification(
        userId,
        'Vaccination Scheduled',
        `Next dose of ${record.vaccineName} for ${record.cattle.name || record.cattle.tagNumber} is scheduled for ${record.nextDueDate.toLocaleDateString()}.`,
        'VACCINATION'
      );
    }

    res.status(201).json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteHealthRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.healthRecord.delete({ where: { id: Number(id), userId: req.user!.userId } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteVaccination = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.vaccination.delete({ where: { id: Number(id), userId: req.user!.userId } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
