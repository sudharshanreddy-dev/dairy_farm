import request from 'supertest';
import { app } from '../src/app';
import { prismaMock, createToken } from './setup';
import { prismaHelpers } from './test-utils';

const helpers = prismaHelpers(prismaMock);
const token = createToken(1, 'testuser', 'Test User');

describe('Farm Operations (v2.0)', () => {
  describe('Milk Production logging', () => {
    it('creates a record and returns the calculated total yield', async () => {
      const payload = {
        cattleId: 1,
        date: new Date().toISOString(),
        morningYield: 12.0,
        eveningYield: 10.0
      };

      prismaMock.milkProduction.create.mockResolvedValue({
        id: 1,
        ...payload,
        date: new Date(payload.date),
        totalYield: 22.0,
        userId: 1
      } as any);

      const res = await request(app)
        .post('/api/farm/milk')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.totalYield).toBe(22.0);
    });

    it('rejects invalid yield values', async () => {
      const res = await request(app)
        .post('/api/farm/milk')
        .set('Authorization', `Bearer ${token}`)
        .send({ cattleId: 1, morningYield: -1 });

      expect(res.status).toBe(400);
    });
  });

  describe('Financial Analytics Dashboard', () => {
    it('aggregates data correctly to calculate Net Profit and CPL', async () => {
      // Mock all the required aggregations for the analytics endpoint
      (prismaMock.sale.aggregate as jest.Mock).mockResolvedValue({ _sum: { totalAmount: 10000 } });
      (prismaMock.healthRecord.aggregate as jest.Mock).mockResolvedValue({ _sum: { cost: 2000 } });
      (prismaMock.vaccination.aggregate as jest.Mock).mockResolvedValue({ _sum: { cost: 500 } });
      (prismaMock.cattle.aggregate as jest.Mock).mockResolvedValue({ _sum: { purchasePrice: 3000 } });
      (prismaMock.milkProduction.aggregate as jest.Mock).mockResolvedValue({ _sum: { totalYield: 500 } });

      // Mock empty lists for the other parts of the dashboard
      prismaMock.inventory.findMany.mockResolvedValue([]);
      prismaMock.milkProduction.findMany.mockResolvedValue([]);
      prismaMock.sale.findMany.mockResolvedValue([]);
      prismaMock.feedingLog.findMany.mockResolvedValue([]);
      prismaMock.milkProduction.groupBy.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/farm/analytics')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.netProfit).toBe(4500); // 10000 - (2000 + 500 + 3000)
      expect(res.body.costPerLiter).toBe(11); // (2000 + 500 + 3000) / 500
    });
  });

  describe('Inventory & Feeding Synchronization', () => {
    it('deducts inventory when logging a feeding session', async () => {
      const feedingData = { inventoryId: 10, totalQuantity: 50, cattleCount: 5 };
      
      helpers.mockCreated('feedingLog', feedingData);
      helpers.mockCreated('inventoryTransaction', {});
      helpers.mockUpdated('inventory', {});

      const res = await request(app)
        .post('/api/farm/feeding')
        .set('Authorization', `Bearer ${token}`)
        .send(feedingData);

      expect(res.status).toBe(201);
      expect(prismaMock.inventory.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 10 },
        data: { quantity: { decrement: 50 } }
      }));
    });
  });

  describe('Automated Alert System', () => {
    it('triggers stock alerts when inventory drops below minimum', async () => {
      const lowStockItem = { 
        id: 1, 
        itemName: 'Grain', 
        quantity: 5, 
        minQuantity: 20, 
        userId: 1,
        category: 'Feed'
      };

      // Mock findMany calls for Expiry check (empty) and Stock check (1 item)
      (prismaMock.inventory.findMany as jest.Mock)
        .mockResolvedValueOnce([]) 
        .mockResolvedValueOnce([lowStockItem as any]);
      
      prismaMock.alert.findFirst.mockResolvedValue(null);
      helpers.mockCreated('alert', { type: 'Stock' });

      const res = await request(app)
        .post('/api/farm/alerts/check')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(prismaMock.alert.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          type: 'Stock',
          message: expect.stringContaining('Grain')
        })
      }));
    });
  });
});
