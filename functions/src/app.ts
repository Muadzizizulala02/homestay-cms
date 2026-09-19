import express from 'express';
import cors from 'cors';
import './config/firebase';
import healthRoutes from './routes/health.routes';
import publicRoutes from './routes/public.routes';
import adminAuthRoutes from './routes/admin/auth.routes';
import adminAccommodationRoutes from './routes/admin/accommodation.routes';
import adminMediaRoutes from './routes/admin/media.routes';
import adminContentRoutes from './routes/admin/content.routes';
import { errorHandler } from './middleware/error.middleware';

export const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

app.use('/api/v1', healthRoutes);
app.use('/api/v1', publicRoutes);
app.use('/api/v1/admin', adminAuthRoutes);
app.use('/api/v1/admin/accommodations', adminAccommodationRoutes);
app.use('/api/v1/admin/media', adminMediaRoutes);
app.use('/api/v1/admin/site-settings', adminContentRoutes);

// Must be registered last: Express only routes next(err) calls to middleware
// with this (err, req, res, next) signature defined after the routes that threw.
app.use(errorHandler);
