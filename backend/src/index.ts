import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import { connectRedis } from './redis';

const PORT = process.env.PORT || 3000;

export const startServer = async () => {
  await connectRedis();
  
  return app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
