import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import applicationRoutes from './routes/applicationRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { parseAllowedOrigins } from './utils/validation.js';

const app = express();
const allowedOrigins = parseAllowedOrigins();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      const corsError = new Error('CORS origin not allowed');
      corsError.statusCode = 403;
      callback(corsError);
    },
    credentials: true,
  }),
);
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'MERN backend is running' });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
  });
});

app.use('/api/applications', applicationRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
