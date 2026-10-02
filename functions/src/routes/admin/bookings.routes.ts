import express, { type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as adminBookingService from '../../services/admin-booking.service';
import * as paymentService from '../../services/payment.service';

const router = express.Router();

router.use(requireAdmin);

const idParams = validate(z.object({ id: z.string().min(1) }), 'params');

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(await adminBookingService.listBookings());
  } catch (err) {
    next(err);
  }
});

// For payment received outside the gateway (bank transfer / cash) while online payment is off.
router.post('/:id/confirm', idParams, async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    await adminBookingService.confirmBookingManually(req.params.id);
    res.status(200).json({ message: 'Booking confirmed.' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/cancel', idParams, async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    await adminBookingService.cancelBooking(req.params.id);
    res.status(200).json({ message: 'Booking cancelled and dates released.' });
  } catch (err) {
    next(err);
  }
});

// ToyyibPay has no confirmed refund API, so this only updates our own records — the admin
// still processes the actual refund through ToyyibPay themselves.
router.post('/:id/refund', idParams, async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    await paymentService.markPaymentRefunded(req.params.id);
    res.status(200).json({ message: 'Recorded as refunded. Process the actual refund through ToyyibPay.' });
  } catch (err) {
    next(err);
  }
});

export default router;
