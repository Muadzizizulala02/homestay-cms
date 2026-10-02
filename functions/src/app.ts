import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { corsOptions } from './config/cors';
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

// Cloud Functions sits behind Google's front end; trust one hop so req.ip is the real client,
// not the proxy (otherwise every guest would share one rate-limit bucket).
app.set('trust proxy', 1);
app.use(cors(corsOptions));
app.use(express.json());
// ToyyibPay posts its webhook as application/x-www-form-urlencoded, not JSON.
app.use(express.urlencoded({ extended: false }));

// Mounted at /v1, not /api/v1: the Cloud Function itself is named `api`, and Firebase strips
// the function name from the URL before Express ever sees the request — a client calling
// https://.../api/v1/health has Express receive only "/v1/health". Mounting at /api/v1 here
// would silently 404 every route. The full client-facing URL still reads .../api/v1/... (see
// environment.apiUrl in the frontend) because that "api" segment is the function name, supplied
// by the caller, not part of what Express routes on.
// Public guest endpoints that create records or take a reference+email guess: cap per IP.
// In-memory, so the cap is per function instance — a speed bump against casual abuse, not a
// hard guarantee. The ToyyibPay webhook is deliberately not limited (it authenticates by hash).
const guestBookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again shortly.' } },
});
app.use('/v1/bookings', guestBookingLimiter);

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
