import cors from 'cors';
import express from 'express';
import profileRoutes from './routes/profileRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'MERN backend is running' });
});

app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
