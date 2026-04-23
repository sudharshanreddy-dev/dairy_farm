import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import cattleRoutes from './routes/cattle.routes';
import farmRoutes from './routes/farm.routes';
import reportRoutes from './routes/report.routes';

const app = express();

app.use(cors());
app.use(express.json());

// Log incoming requests and responses
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Dairy Farm API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/cattle', cattleRoutes);
app.use('/api/farm', farmRoutes);
app.use('/api/reports', reportRoutes);

export { app };
