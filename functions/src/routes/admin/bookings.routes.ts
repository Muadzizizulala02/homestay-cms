import express, { type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as paymentService from '../../services/payment.service';

const router = express.Router();

router.use(requireAdmin);

// There is no full admin bookings list/detail screen yet (planned — see docs/CMS.md); this is
// just the refund action, callable once that screen exists. Billplz has no refund API, so this
// only updates our own records — the admin still processes the actual refund in the Billplz
// dashboard themselves.
router.post(
  '/:id/refund',
  validate(z.object({ id: z.string().min(1) }), 'params'),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      await paymentService.markPaymentRefunded(req.params.id);
      res.status(200).json({ message: 'Recorded as refunded. Process the actual refund in the Billplz dashboard.' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
