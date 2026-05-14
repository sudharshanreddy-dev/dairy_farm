import { Request, Response } from "express";
import { prisma } from "../db";
import { redisClient } from "../redis";
import QRCode from 'qrcode';

export const getCattleDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const cattleId = Number(id);

    if (isNaN(cattleId)) {
      res.status(400).json({ error: 'Invalid cattle ID' });
      return;
    }

    const cacheKey = `cattle:${cattleId}`;
    
    // Attempt to retrieve from cache
    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        const cattle = JSON.parse(cachedData);
        if (cattle.userId === userId) {
          console.log(`Serving cattle ${cattleId} from Redis cache`);
          res.json(cattle);
          return;
        }
      }
    } catch (cacheErr) {
      console.warn('Redis cache read error:', cacheErr);
    }

    const cattle = await prisma.cattle.findUnique({
      where: { id: cattleId },
      include: {
        dam: {
          include: {
            dam: { select: { id: true, name: true, tagNumber: true } },
            sire: { select: { id: true, name: true, tagNumber: true } }
          }
        },
        sire: {
          include: {
            dam: { select: { id: true, name: true, tagNumber: true } },
            sire: { select: { id: true, name: true, tagNumber: true } }
          }
        },
        damOffspring: {
          select: { id: true, name: true, tagNumber: true, status: true },
          take: 5
        },
        sireOffspring: {
          select: { id: true, name: true, tagNumber: true, status: true },
          take: 5
        },
        milkRecords: {
          orderBy: { date: 'desc' },
          take: 10
        },
        healthRecords: {
          orderBy: { date: 'desc' },
          take: 10
        },
        vaccinations: {
          orderBy: { dateGiven: 'desc' },
          take: 10
        }
      }
    });

    if (!cattle) {
      res.status(404).json({ error: 'Cattle not found' });
      return;
    }

    if (cattle.userId !== userId) {
      res.status(403).json({ error: 'Unauthorized to view this cattle' });
      return;
    }

    // Store in cache for 15 minutes
    try {
      await redisClient.setEx(cacheKey, 900, JSON.stringify(cattle));
    } catch (cacheErr) {
      console.warn('Redis cache write error:', cacheErr);
    }

    res.json(cattle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCattlePublic = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const cattleId = Number(id);

    if (isNaN(cattleId)) {
      res.status(400).json({ error: 'Invalid cattle ID' });
      return;
    }

    const cattle = await prisma.cattle.findUnique({
      where: { id: cattleId },
      include: {
        user: { select: { fullName: true, farmName: true } },
        dam: { select: { id: true, name: true, tagNumber: true } },
        sire: { select: { id: true, name: true, tagNumber: true } },
        damOffspring: { select: { id: true, name: true, tagNumber: true }, take: 3 },
        sireOffspring: { select: { id: true, name: true, tagNumber: true }, take: 3 }
      }
    });

    if (!cattle) {
      res.status(404).json({ error: 'Cattle not found' });
      return;
    }

    const isOwner = req.user && req.user.userId === cattle.userId;

    res.json({
      isOwner: !!isOwner,
      cattle: {
        ...cattle,
        // Ensure user info is present but redacted if not owner
        user: cattle.user,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCattleShareInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const shareUrl = `myapp://cattle/${id}`; 
    
    // Generate QR Code data URL
    const qrCodeBase64 = await QRCode.toDataURL(shareUrl);

    res.json({
      link: shareUrl,
      qrCode: qrCodeBase64
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate share info' });
  }
};

export const listCattle = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { breed, status, gender, quality, sortBy, order } = req.query;

    const where: any = { userId };
    if (breed) where.breed = breed;
    if (status) where.status = status;
    if (gender) where.gender = gender;
    if (quality) where.quality = quality;

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy as string] = order === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const cattle = await prisma.cattle.findMany({ 
      where,
      orderBy 
    });
    res.json(cattle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createCattle = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const username = req.user!.username;
    let { tagNumber, breed, damId, sireId } = req.body;

    const parseNum = (v: any, def: any = undefined) => {
      const p = parseFloat(v);
      return isNaN(p) ? def : p;
    };

    // Auto-generate tagNumber if not provided
    if (!tagNumber || tagNumber.trim() === '') {
      let suffix = 1;
      let generatedTag = '';
      let isUnique = false;

      // Ensure we generate a truly unique tag number for this user
      while (!isUnique) {
        generatedTag = `${username.slice(0, 3).toUpperCase()}-${(breed || 'UNK').slice(0, 3).toUpperCase()}-${suffix.toString().padStart(3, '0')}`;
        const existing = await prisma.cattle.findFirst({ where: { userId, tagNumber: generatedTag } });
        if (!existing) {
          isUnique = true;
        } else {
          suffix++;
        }
      }
      tagNumber = generatedTag;
    } else {
      // If provided, check if it's already taken by this user
      const existing = await prisma.cattle.findFirst({ where: { userId, tagNumber } });
      if (existing) {
        res.status(400).json({ error: `Tag number ${tagNumber} is already registered to your farm.` });
        return;
      }
    }

    // Validate parent IDs if provided
    const parsedDamId = parseNum(damId);
    const parsedSireId = parseNum(sireId);

    if (parsedDamId) {
      const dam = await prisma.cattle.findFirst({ where: { id: parsedDamId, userId } });
      if (!dam) {
        res.status(400).json({ error: `Dam ID ${parsedDamId} not found in your records.` });
        return;
      }
    }

    if (parsedSireId) {
      const sire = await prisma.cattle.findFirst({ where: { id: parsedSireId, userId } });
      if (!sire) {
        res.status(400).json({ error: `Sire ID ${parsedSireId} not found in your records.` });
        return;
      }
    }

    const data = {
      ...req.body,
      tagNumber,
      userId,
      weight: parseNum(req.body.weight),
      purchasePrice: parseNum(req.body.purchasePrice, 0),
      salePrice: parseNum(req.body.salePrice, 0),
      damId: parsedDamId,
      sireId: parsedSireId,
      dateOfBirth: req.body.dateOfBirth && !isNaN(Date.parse(req.body.dateOfBirth)) ? new Date(req.body.dateOfBirth) : undefined,
      purchaseDate: req.body.purchaseDate && !isNaN(Date.parse(req.body.purchaseDate)) ? new Date(req.body.purchaseDate) : undefined,
    };

    const cattle = await prisma.cattle.create({ data });
    res.status(201).json(cattle);
  } catch (err: any) {
    console.error('Create Cattle Error:', err);
    res.status(500).json({ error: err.message || 'Failed to register cattle. Please check your inputs.' });
  }
};

export const updateCattle = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    
    const existing = await prisma.cattle.findFirst({ where: { id: Number(id), userId } });
    if (!existing) {
      res.status(404).json({ error: 'Cattle not found or unauthorized' });
      return;
    }

    const parseNum = (v: any, def: any = undefined) => {
      const p = parseFloat(v);
      return isNaN(p) ? def : p;
    };

    const data = { ...req.body };
    if (data.weight !== undefined) data.weight = parseNum(data.weight);
    if (data.purchasePrice !== undefined) data.purchasePrice = parseNum(data.purchasePrice, 0);
    if (data.salePrice !== undefined) data.salePrice = parseNum(data.salePrice, 0);
    
    if (data.damId !== undefined) {
      data.damId = parseNum(data.damId);
      if (data.damId) {
        const dam = await prisma.cattle.findFirst({ where: { id: data.damId, userId } });
        if (!dam) {
          res.status(400).json({ error: `Dam ID ${data.damId} not found.` });
          return;
        }
      }
    }
    
    if (data.sireId !== undefined) {
      data.sireId = parseNum(data.sireId);
      if (data.sireId) {
        const sire = await prisma.cattle.findFirst({ where: { id: data.sireId, userId } });
        if (!sire) {
          res.status(400).json({ error: `Sire ID ${data.sireId} not found.` });
          return;
        }
      }
    }

    if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth);
    if (data.purchaseDate) data.purchaseDate = new Date(data.purchaseDate);

    const cattle = await prisma.cattle.update({
      where: { id: Number(id) },
      data
    });

    // Clear cache
    try {
      await redisClient.del(`cattle:${id}`);
    } catch (cacheErr) {}

    res.json(cattle);
  } catch (err: any) {
    console.error('Update Cattle Error:', err);
    res.status(500).json({ error: err.message || 'Update failed' });
  }
};

export const deleteCattle = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const cattleId = Number(id);

    if (isNaN(cattleId)) {
      res.status(400).json({ error: 'Invalid cattle ID' });
      return;
    }
    
    const existing = await prisma.cattle.findFirst({ where: { id: cattleId, userId } });
    if (!existing) {
      res.status(404).json({ error: 'Cattle not found or unauthorized' });
      return;
    }

    console.log(`Deleting cattle ${cattleId} and its related records...`);

    // Use a transaction to ensure all related data is cleaned up or none
    await prisma.$transaction(async (tx) => {
      // Manually delete related records
      await tx.healthRecord.deleteMany({ where: { cattleId } });
      await tx.milkProduction.deleteMany({ where: { cattleId } });
      await tx.vaccination.deleteMany({ where: { cattleId } });

      // Null out parental references in offspring
      await tx.cattle.updateMany({
        where: { damId: cattleId },
        data: { damId: null }
      });
      
      await tx.cattle.updateMany({
        where: { sireId: cattleId },
        data: { sireId: null }
      });

      // Finally delete the cattle record
      await tx.cattle.delete({ where: { id: cattleId } });
    });

    // Clear cache
    try {
      await redisClient.del(`cattle:${cattleId}`);
      console.log(`Cache cleared for cattle:${cattleId}`);
    } catch (cacheErr) {
      console.warn('Redis cache delete error:', cacheErr);
    }

    res.json({ message: 'Cattle deleted successfully' });
  } catch (err: any) {
    console.error('Delete Cattle Error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
