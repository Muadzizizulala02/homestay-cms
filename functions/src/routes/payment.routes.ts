import express, { type NextFunction, type Request, type Response } from 'express';
import * as paymentService from '../services/payment.service';

const router = express.Router();

// No requireAdmin, no guest auth — ToyyibPay calls this server-to-server. The hash check
// inside handleToyyibPayWebhook is what actually authenticates the caller.
router.post('/payments/webhook/toyyibpay', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await paymentService.handleToyyibPayWebhook(req.body as Record<string, string>);
    res.status(200).send('OK');
  } catch (err) {
    next(err);
  }
});

export default router;
