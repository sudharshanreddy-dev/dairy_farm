import request from 'supertest';
import { app } from '../src/app';
import { prismaMock, createToken } from './setup';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Auth Controller', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        password: 'Password123!',
        full_name: 'Test User',
        farm_name: 'Test Farm'
      };

      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 1,
        username: userData.username,
        fullName: userData.full_name,
        farmName: userData.farm_name,
        passwordHash: 'hashed_password',
        role: 'Farmer',
        createdAt: new Date(),
        email: null
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.username).toBe(userData.username);
    });

    it('should fail if user already exists', async () => {
      prismaMock.user.findFirst.mockResolvedValue({ id: 1 } as any);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'existinguser',
          password: 'Password123!',
          full_name: 'Existing',
          farm_name: 'Farm'
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Username or Email already exists');
    });

    it('should fail Joi validation for weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'weak',
          full_name: 'Test User',
          farm_name: 'Test Farm'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        username: 'testuser',
        passwordHash: hashedPassword,
        fullName: 'Test User'
      } as any);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'Password123!' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should fail with wrong password', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        username: 'testuser',
        passwordHash: hashedPassword
      } as any);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'WrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });
  });

  describe('POST /api/auth/change-password', () => {
    const token = createToken(1, 'testuser');

    it('should change password successfully', async () => {
      const oldHashed = await bcrypt.hash('OldPass123!', 10);
      prismaMock.user.findUnique.mockResolvedValue({ id: 1, passwordHash: oldHashed } as any);
      prismaMock.user.update.mockResolvedValue({ id: 1 } as any);

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ oldPassword: 'OldPass123!', newPassword: 'NewPassword123!' });

      expect(res.status).toBe(200);
      expect(prismaMock.user.update).toHaveBeenCalled();
    });

    it('should fail if old password is wrong', async () => {
      const oldHashed = await bcrypt.hash('OldPass123!', 10);
      prismaMock.user.findUnique.mockResolvedValue({ id: 1, passwordHash: oldHashed } as any);

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ oldPassword: 'WrongOldPass', newPassword: 'NewPassword123!' });

      expect(res.status).toBe(401);
    });
  });
});
