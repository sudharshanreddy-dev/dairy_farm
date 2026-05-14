import request from 'supertest';
import { app } from '../src/app';
import { prismaMock, createToken } from './setup';
import { prismaHelpers } from './test-utils';
import bcrypt from 'bcrypt';

const helpers = prismaHelpers(prismaMock);

describe('Auth Controller (v2.0)', () => {
  describe('Registration Flow', () => {
    const validUser = {
      username: 'newfarmer',
      password: 'StrongPassword123!',
      full_name: 'New Farmer',
      farm_name: 'Green Acres'
    };

    it('successfully registers a new user and returns a token', async () => {
      helpers.mockNotFound('user');
      prismaMock.user.create.mockResolvedValue({
        id: 1,
        username: validUser.username,
        fullName: validUser.full_name,
        farmName: validUser.farm_name,
        passwordHash: 'hashed',
        role: 'Farmer',
        createdAt: new Date(),
        email: null
      });

      const res = await request(app).post('/api/auth/register').send(validUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.username).toBe(validUser.username);
    });

    it('blocks registration if username already exists', async () => {
      helpers.mockExists('user', { id: 1 });

      const res = await request(app).post('/api/auth/register').send(validUser);

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already exists/i);
    });

    describe.each([
      ['empty password', { ...validUser, password: '' }],
      ['weak password', { ...validUser, password: '123' }],
      ['missing username', { ...validUser, username: '' }],
    ])('validation error: %s', (_, payload) => {
      it('returns 400 Bad Request', async () => {
        const res = await request(app).post('/api/auth/register').send(payload);
        expect(res.status).toBe(400);
      });
    });
  });

  describe('Login Flow', () => {
    it('authenticates valid credentials', async () => {
      const pass = 'Secret123!';
      const hashed = await bcrypt.hash(pass, 1); // Fast hash for tests
      
      prismaMock.user.findUnique.mockResolvedValue({
        id: 99,
        username: 'loginuser',
        passwordHash: hashed,
        fullName: 'Login User'
      } as any);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'loginuser', password: pass });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('rejects invalid passwords', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 99,
        passwordHash: await bcrypt.hash('Correct123!', 1)
      } as any);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'loginuser', password: 'WrongPassword' });

      expect(res.status).toBe(401);
    });
  });

  describe('Account Security', () => {
    const token = createToken(1, 'testuser');

    it('allows users to change their password with valid old password', async () => {
      const oldPass = 'OldPass123!';
      const oldHashed = await bcrypt.hash(oldPass, 1);
      
      prismaMock.user.findUnique.mockResolvedValue({ id: 1, passwordHash: oldHashed } as any);
      helpers.mockUpdated('user', { id: 1 });

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ oldPassword: oldPass, newPassword: 'NewPassword123!' });

      expect(res.status).toBe(200);
      expect(prismaMock.user.update).toHaveBeenCalled();
    });
  });
});

