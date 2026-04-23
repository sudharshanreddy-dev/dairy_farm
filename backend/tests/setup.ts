import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { prisma } from '../src/db';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test-secret-key-change-in-prod';

jest.mock('../src/db', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

jest.mock('../src/redis', () => ({
  redisClient: {
    connect: jest.fn().mockResolvedValue(null),
    on: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
  connectRedis: jest.fn().mockResolvedValue(null),
}));

export const createToken = (userId: number, username: string, fullName: string = 'Test User') => {
  return jwt.sign(
    { userId, username, fullName },
    process.env.JWT_SECRET || 'test-secret-key-change-in-prod',
    { expiresIn: '1h' }
  );
};
