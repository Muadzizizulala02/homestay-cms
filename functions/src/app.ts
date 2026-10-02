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
// ToyyibPay posts its webhook as application/x-www-form-urlencoded, not JSON.
app.use(express.urlencoded({ extended: false }));

// Mounted at /v1, not /api/v1: the Cloud Function itself is named `api`, and Firebase strips
// the function name from the URL before Express ever sees the request — a client calling
// https://.../api/v1/health has Express receive only "/v1/health". Mounting at /api/v1 here
// would silently 404 every route. The full client-facing URL still reads .../api/v1/... (see
// environment.apiUrl in the frontend) because that "api" segment is the function name, supplied
// by the caller, not part of what Express routes on.
app.use('/v1', healthRoutes);
app.use('/v1', publicRoutes);
app.use('/v1', bookingRoutes);
app.use('/v1', paymentRoutes);
app.use('/v1/admin', adminAuthRoutes);
app.use('/v1/admin/accommodations', adminAccommodationRoutes);
app.use('/v1/admin/media', adminMediaRoutes);
app.use('/v1/admin/site-settings', adminContentRoutes);
app.use('/v1/admin/bookings', adminBookingsRoutes);

// Must be registered last: Express only routes next(err) calls to middleware
// with this (err, req, res, next) signature defined after the routes that threw.
app.use(errorHandler);
