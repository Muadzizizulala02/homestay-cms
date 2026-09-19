import express, { type NextFunction, type Request, type Response } from 'express';
import * as paymentService from '../services/payment.service';

const router = express.Router();

// No requireAdmin, no guest auth — Billplz calls this server-to-server. The X-Signature
// check inside handleBillplzWebhook is what actually authenticates the caller.
router.post('/payments/webhook/billplz', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await paymentService.handleBillplzWebhook(req.body as Record<string, string>);
    res.status(200).send('OK');
  } catch (err) {
    next(err);
  }
});

export default router;
