import * as functions from 'firebase-functions';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { app } from './app';
import { expireStalePendingBookings } from './services/booking.service';

export const api = functions.https.onRequest(app);

// Frees the dates of pending bookings whose hold has lapsed (20 min while online payment is on,
// 48h while the owner follows up manually). Without this, abandoned bookings lock dates forever.
export const expireStaleBookings = onSchedule(
  { schedule: 'every 10 minutes', timeZone: 'Asia/Kuala_Lumpur' },
  async () => {
    await expireStalePendingBookings();
  }
);
