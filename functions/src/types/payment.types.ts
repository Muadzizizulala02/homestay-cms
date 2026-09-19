import type { Timestamp } from 'firebase-admin/firestore';
import type { PaymentStatus } from './booking.types';

export interface Payment {
  id: string;
  bookingId: string;
  gateway: 'billplz';
  gatewayBillId: string;
  amount: number;
  method: string | null;
  status: PaymentStatus;
  /** Kept for audit purposes; never trusted without signature verification. */
  rawWebhookPayload?: Record<string, unknown>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
