import express, { type NextFunction, type Request, type Response } from 'express';
import { validate } from '../middleware/validate.middleware';
import { bookingLookupQuerySchema, createBookingSchema } from '../validation/booking.schema';
import * as bookingService from '../services/booking.service';

const router = express.Router();

router.post('/bookings', validate(createBookingSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await bookingService.createBooking(req.body));
  } catch (err) {
    next(err);
  }
});

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
