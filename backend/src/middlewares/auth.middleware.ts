import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-change-in-prod';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        username: string;
        fullName?: string;
      };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; username: string, fullName: string };
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const createToken = (userId: number, username: string, fullName: string = 'Test User') => {
  return jwt.sign(
    { userId, username, fullName },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};
