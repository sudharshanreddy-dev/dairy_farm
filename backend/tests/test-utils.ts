import { DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

/**
 * Common utilities to reduce boilerplate in Jest tests.
 */
export const prismaHelpers = (prismaMock: DeepMockProxy<PrismaClient>) => ({
  /**
   * Mocks a successful findFirst/findUnique check.
   */
  mockExists: (model: keyof PrismaClient, data: any = { id: 1, userId: 1 }) => {
    (prismaMock[model] as any).findFirst?.mockResolvedValue(data);
    (prismaMock[model] as any).findUnique?.mockResolvedValue(data);
  },

  /**
   * Mocks a not found scenario.
   */
  mockNotFound: (model: keyof PrismaClient) => {
    (prismaMock[model] as any).findFirst?.mockResolvedValue(null);
    (prismaMock[model] as any).findUnique?.mockResolvedValue(null);
  },

  /**
   * Mocks a successful creation.
   */
  mockCreated: (model: keyof PrismaClient, data: any) => {
    (prismaMock[model] as any).create?.mockResolvedValue({ id: 1, ...data });
  },

  /**
   * Mocks a successful update.
   */
  mockUpdated: (model: keyof PrismaClient, data: any) => {
    (prismaMock[model] as any).update?.mockResolvedValue({ id: 1, ...data });
  },
});
