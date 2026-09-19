import express from 'express';
import cors from 'cors';
import './config/firebase';
import healthRoutes from './routes/health.routes';
import publicRoutes from './routes/public.routes';
import bookingRoutes from './routes/booking.routes';
import paymentRoutes from './routes/payment.routes';
import adminAuthRoutes from './routes/admin/auth.routes';
import adminAccommodationRoutes from './routes/admin/accommodation.routes';
import adminMediaRoutes from './routes/admin/media.routes';
import adminContentRoutes from './routes/admin/content.routes';
import adminBookingsRoutes from './routes/admin/bookings.routes';
import { errorHandler } from './middleware/error.middleware';

export const app = express();

app.use(cors({ origin: true }));
app.use(express.json());
// Billplz posts its webhook as application/x-www-form-urlencoded, not JSON.
app.use(express.urlencoded({ extended: false }));

app.use('/api/v1', healthRoutes);
app.use('/api/v1', publicRoutes);
app.use('/api/v1', bookingRoutes);
app.use('/api/v1', paymentRoutes);
app.use('/api/v1/admin', adminAuthRoutes);
app.use('/api/v1/admin/accommodations', adminAccommodationRoutes);
app.use('/api/v1/admin/media', adminMediaRoutes);
app.use('/api/v1/admin/site-settings', adminContentRoutes);
app.use('/api/v1/admin/bookings', adminBookingsRoutes);

// Must be registered last: Express only routes next(err) calls to middleware
// with this (err, req, res, next) signature defined after the routes that threw.
app.use(errorHandler);
