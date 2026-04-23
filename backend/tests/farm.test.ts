import request from 'supertest';
import { app } from '../src/app';
import { prismaMock, createToken } from './setup';

const token = createToken(1, 'testuser', 'Test User');

describe('Farm Controller', () => {
  describe('POST /api/farm/milk', () => {
    it('should create a milk record successfully', async () => {
      const milkData = {
        cattleId: 1,
        date: new Date().toISOString(),
        morningYield: 10.5,
        eveningYield: 8.2,
        notes: 'Healthy production'
      };

      prismaMock.milkProduction.create.mockResolvedValue({
        id: 1,
        ...milkData,
        date: new Date(milkData.date),
        totalYield: 18.7,
        userId: 1,
        quality: 'A',
        createdAt: new Date()
      } as any);

      const res = await request(app)
        .post('/api/farm/milk')
        .set('Authorization', `Bearer ${token}`)
        .send(milkData);

      expect(res.status).toBe(201);
      expect(res.body.totalYield).toBe(18.7);
    });

    it('should fail with negative yield', async () => {
      const res = await request(app)
        .post('/api/farm/milk')
        .set('Authorization', `Bearer ${token}`)
        .send({
          cattleId: 1,
          date: new Date().toISOString(),
          morningYield: -5,
          eveningYield: 8
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('morningYield');
    });
  });

  describe('GET /api/farm/analytics', () => {
    it('should return correct financial aggregation', async () => {
      (prismaMock.sale.aggregate as jest.Mock).mockResolvedValue({ _sum: { totalAmount: 5000 } });
      (prismaMock.healthRecord.aggregate as jest.Mock).mockResolvedValue({ _sum: { cost: 1000 } });
      (prismaMock.vaccination.aggregate as jest.Mock).mockResolvedValue({ _sum: { cost: 500 } });
      (prismaMock.cattle.aggregate as jest.Mock).mockResolvedValue({ _sum: { purchasePrice: 2000 } });
      
      prismaMock.inventory.findMany.mockResolvedValue([]);
      prismaMock.milkProduction.findMany.mockResolvedValue([]);
      prismaMock.sale.findMany.mockResolvedValue([]);
      prismaMock.milkProduction.aggregate.mockResolvedValue({ _sum: { totalYield: 200 } } as any);
      prismaMock.feedingLog.findMany.mockResolvedValue([]);
      prismaMock.milkProduction.groupBy.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/farm/analytics')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('costPerLiter');
      expect(res.body).toHaveProperty('expenseBreakdown');
      expect(res.body.netProfit).toBe(1500);
    });
  });

  describe('Feeding Feature', () => {
    it('should log bulk feeding and deduct inventory', async () => {
      const feedingData = { inventoryId: 1, totalQuantity: 10, cattleCount: 2 };
      
      prismaMock.feedingLog.create.mockResolvedValue({ id: 1, ...feedingData } as any);
      prismaMock.inventoryTransaction.create.mockResolvedValue({ id: 1 } as any);
      prismaMock.inventory.update.mockResolvedValue({ id: 1 } as any);

      const res = await request(app)
        .post('/api/farm/feeding')
        .set('Authorization', `Bearer ${token}`)
        .send(feedingData);

      expect(res.status).toBe(201);
      expect(prismaMock.inventoryTransaction.create).toHaveBeenCalled();
    });

    it('should list feeding logs', async () => {
      prismaMock.feedingLog.findMany.mockResolvedValue([{ id: 1, totalQuantity: 10 }] as any);
      
      const res = await request(app)
        .get('/api/farm/feeding')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });
  });

  describe('DELETE Routes', () => {
    it('should delete a milk record', async () => {
      prismaMock.milkProduction.findFirst.mockResolvedValue({ id: 1, userId: 1 } as any);
      prismaMock.milkProduction.delete.mockResolvedValue({ id: 1 } as any);
      
      const res = await request(app)
        .delete('/api/farm/milk/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/farm/alerts/check', () => {
    it('should generate alerts for low stock', async () => {
      const item = { 
        id: 10, 
        itemName: 'Feed', 
        quantity: 5, 
        minQuantity: 10, 
        userId: 1, 
        category: 'Feed', 
        unit: 'kg', 
        costPerUnit: 20, 
        lastStockUpdate: new Date(),
        expiryDate: null
      };
      
      // 1st call (Expiry check with filtering): return empty
      // 2nd call (All items check): return the one item
      (prismaMock.inventory.findMany as jest.Mock)
        .mockResolvedValueOnce([]) 
        .mockResolvedValueOnce([item as any]);
      
      prismaMock.alert.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/farm/alerts/check')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(prismaMock.alert.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          type: 'Stock',
          message: expect.stringContaining('Feed')
        })
      }));
    });
  });
});
