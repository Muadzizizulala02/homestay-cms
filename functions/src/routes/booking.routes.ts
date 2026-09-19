import express, { type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.middleware';
import { bookingLookupQuerySchema, createBookingSchema } from '../validation/booking.schema';
import * as bookingService from '../services/booking.service';
import * as paymentService from '../services/payment.service';

const router = express.Router();

router.post('/bookings', validate(createBookingSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await bookingService.createBooking(req.body));
  } catch (err) {
    next(err);
  }
});

// Deliberately separate from booking creation: an external HTTP call (to Billplz) must never
// happen inside the booking-creation Firestore transaction (see payment.service.ts).
router.post(
  '/bookings/:id/payment',
  validate(z.object({ id: z.string().min(1) }), 'params'),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      res.status(200).json(await paymentService.createPaymentForBooking(req.params.id));
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/bookings/lookup',
  validate(bookingLookupQuerySchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reference, email } = req.query as unknown as { reference: string; email: string };
      res.status(200).json(await bookingService.getBookingByReferenceAndEmail(reference, email));
    } catch (err) {
      next(err);
    }
  }
);

export default router;
