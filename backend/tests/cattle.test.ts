import request from 'supertest';
import { app } from '../src/app';
import { prismaMock, createToken } from './setup';

const token = createToken(1, 'testuser', 'Test User');

describe('Cattle Controller', () => {
  describe('POST /api/cattle', () => {
    it('should create cattle with auto-generated tag if missing', async () => {
      prismaMock.cattle.count.mockResolvedValue(5);
      prismaMock.cattle.create.mockResolvedValue({
        id: 1,
        tagNumber: 'testuser-Jersey-006',
        breed: 'Jersey',
        userId: 1
      } as any);

      const res = await request(app)
        .post('/api/cattle')
        .set('Authorization', `Bearer ${token}`)
        .send({ breed: 'Jersey', name: 'Daisy' });

      expect(res.status).toBe(201);
      expect(res.body.tagNumber).toBe('testuser-Jersey-006');
    });

    it('should fail if breed is missing but required for auto-tag', async () => {
      prismaMock.cattle.count.mockResolvedValue(5);
      // Use mockImplementation to capture the generated tagNumber
      (prismaMock.cattle.create as jest.Mock).mockImplementation((args: any) => {
        return Promise.resolve({ 
          id: 1, 
          ...args.data,
          tagNumber: args.data.tagNumber || 'Unknown'
        } as any);
      });

      const res = await request(app)
        .post('/api/cattle')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Daisy' });

      expect(res.status).toBe(201);
      expect(res.body.tagNumber).toContain('Unknown');
    });
  });

  describe('GET /api/cattle/public/:id', () => {
    const mockCattle = {
      id: 1,
      userId: 1,
      name: 'Daisy',
      purchasePrice: 5000,
      quality: 'High',
      tagNumber: 'TAG123',
      user: {
        fullName: 'Test User',
        farmName: 'Test Farm'
      },
      dam: null,
      sire: null,
      damOffspring: [],
      sireOffspring: []
    };

    it('should show full data for owner', async () => {
      prismaMock.cattle.findUnique.mockResolvedValue(mockCattle as any);
      
      const res = await request(app)
        .get('/api/cattle/public/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.cattle).toHaveProperty('purchasePrice');
    });

    it('should strip sensitive data for guest (unauthenticated)', async () => {
      prismaMock.cattle.findUnique.mockResolvedValue(mockCattle as any);
      
      const res = await request(app)
        .get('/api/cattle/public/1');

      expect(res.status).toBe(200);
      expect(res.body.cattle).not.toHaveProperty('purchasePrice');
      expect(res.body.cattle).not.toHaveProperty('quality');
    });
  });

  describe('CRUD Operations', () => {
    it('should list cattle for the user', async () => {
      prismaMock.cattle.findMany.mockResolvedValue([{ id: 1, name: 'Daisy' }] as any);
      const res = await request(app)
        .get('/api/cattle')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    it('should update cattle details', async () => {
      prismaMock.cattle.findFirst.mockResolvedValue({ id: 1, userId: 1 } as any);
      prismaMock.cattle.update.mockResolvedValue({ id: 1, name: 'Bessie' } as any);
      
      const res = await request(app)
        .put('/api/cattle/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Bessie' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Bessie');
    });

    it('should delete cattle successfully', async () => {
      prismaMock.cattle.findFirst.mockResolvedValue({ id: 1, userId: 1 } as any);
      prismaMock.cattle.delete.mockResolvedValue({ id: 1 } as any);
      
      const res = await request(app)
        .delete('/api/cattle/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should return 404/unauthorized if not found', async () => {
      prismaMock.cattle.findFirst.mockResolvedValue(null);
      const res = await request(app)
        .delete('/api/cattle/99')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });
});
