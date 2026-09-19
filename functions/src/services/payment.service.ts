import crypto from 'node:crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../config/firebase';
import { env } from '../config/env';
import { AppError } from '../utils/app-error';
import type { Booking, BookingStatus } from '../types/booking.types';
import type { Payment } from '../types/payment.types';
import type { PaymentStatus } from '../types/booking.types';

const COLLECTION = 'payments';

interface CreateBillplzBillInput {
  amountInCents: number;
  email: string;
  name: string;
  mobile?: string;
  description: string;
  reference: string;
}

async function createBillplzBill(input: CreateBillplzBillInput): Promise<{ id: string; url: string }> {
  const body = new URLSearchParams({
    collection_id: env.billplzCollectionId,
    email: input.email,
    name: input.name,
    amount: String(input.amountInCents),
    callback_url: `${env.apiBaseUrl}/api/v1/payments/webhook/billplz`,
    redirect_url: `${env.frontendBaseUrl}/booking/confirmation?reference=${encodeURIComponent(input.reference)}`,
    description: input.description,
    reference_1_label: 'Booking reference',
    reference_1: input.reference,
  });
  if (input.mobile) {
    body.set('mobile', input.mobile);
  }

  // Billplz auth: HTTP Basic with the secret key as the username and an empty password.
  const auth = Buffer.from(`${env.billplzSecretKey}:`).toString('base64');
  const res = await fetch(`${env.billplzBaseUrl}/api/v3/bills`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    throw new AppError(502, 'Could not create a payment with the gateway', 'PAYMENT_GATEWAY_ERROR');
  }

  const data = (await res.json()) as { id: string; url: string };
  return { id: data.id, url: data.url };
}

/**
 * Creates (or reuses) a Billplz bill for a pending_payment booking and records it in `payments`.
 * Deliberately not part of the booking-creation transaction: an external HTTP call inside a
 * Firestore transaction risks creating duplicate bills if the transaction retries.
 */
export async function createPaymentForBooking(bookingId: string): Promise<{ redirectUrl: string }> {
  const bookingDoc = await db.collection('bookings').doc(bookingId).get();
  if (!bookingDoc.exists) {
    throw new AppError(404, 'Booking not found', 'BOOKING_NOT_FOUND');
  }
  const booking = bookingDoc.data() as Booking;
  if (booking.status !== 'pending_payment') {
    throw new AppError(409, 'This booking is not awaiting payment', 'BOOKING_NOT_PENDING');
  }

  const existingSnap = await db.collection(COLLECTION).where('bookingId', '==', bookingId).limit(1).get();
  if (!existingSnap.empty) {
    const existing = existingSnap.docs[0].data() as Payment;
    if (existing.status === 'paid') {
      throw new AppError(409, 'This booking has already been paid', 'ALREADY_PAID');
    }
    if (existing.status === 'pending') {
      // Reuse the bill already created rather than creating a duplicate at Billplz.
      return { redirectUrl: `${env.billplzBaseUrl}/bills/${existing.gatewayBillId}` };
    }
  }

  const bill = await createBillplzBill({
    amountInCents: Math.round(booking.price.total * 100),
    email: booking.guest.email,
    name: booking.guest.name,
    mobile: booking.guest.phone,
    description: `Booking ${booking.reference}`,
    reference: booking.reference,
  });

  const paymentRef = db.collection(COLLECTION).doc();
  const now = Timestamp.now();
  const payment: Payment = {
    id: paymentRef.id,
    bookingId,
    gateway: 'billplz',
    gatewayBillId: bill.id,
    amount: booking.price.total,
    method: null,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  await paymentRef.set(payment);

  return { redirectUrl: bill.url };
}

/**
 * Verifies a Billplz X-Signature: sort every field except x_signature by key (ascending,
 * case-insensitive), concatenate each as `key+value`, join with `|`, HMAC-SHA256 with the
 * X Signature key, and compare to the provided value. This is the only thing that may ever
 * flip a payment to `paid` — the frontend redirect is UX only and is never trusted.
 */
export function verifyBillplzSignature(payload: Record<string, string>): boolean {
  const { x_signature: providedSignature, ...rest } = payload;
  if (!providedSignature) {
    return false;
  }

  const sortedKeys = Object.keys(rest).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const sourceString = sortedKeys.map((key) => `${key}${rest[key]}`).join('|');
  const expected = crypto.createHmac('sha256', env.billplzXSignatureKey).update(sourceString).digest('hex');

  const expectedBuffer = Buffer.from(expected, 'hex');
  const providedBuffer = Buffer.from(providedSignature, 'hex');
  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

/** Handles Billplz's server-to-server callback. Must respond quickly — Billplz times out at 20s. */
export async function handleBillplzWebhook(payload: Record<string, string>): Promise<void> {
  if (!verifyBillplzSignature(payload)) {
    throw new AppError(401, 'Invalid webhook signature', 'INVALID_SIGNATURE');
  }

  const paymentSnap = await db.collection(COLLECTION).where('gatewayBillId', '==', payload['id']).limit(1).get();
  if (paymentSnap.empty) {
    // Unknown bill — acknowledge quietly. Billplz retries on a non-200, and there is nothing
    // useful an error would communicate for a bill that isn't ours.
    return;
  }

  const paymentDoc = paymentSnap.docs[0];
  const payment = paymentDoc.data() as Payment;
  const isPaid = payload['paid'] === 'true';
  const paymentStatus: PaymentStatus = isPaid ? 'paid' : 'failed';

  await db.runTransaction(async (tx) => {
    tx.update(paymentDoc.ref, {
      status: paymentStatus,
      rawWebhookPayload: payload,
      updatedAt: Timestamp.now(),
    });
    tx.update(db.collection('bookings').doc(payment.bookingId), {
      status: (isPaid ? 'confirmed' : 'pending_payment') satisfies BookingStatus,
      paymentStatus,
      ...(isPaid ? { holdExpiresAt: null } : {}),
      updatedAt: Timestamp.now(),
    });
  });
}

/**
 * Records a booking's payment as refunded. Billplz has no refund API (confirmed against their
 * docs — refunds are dashboard-only), so this does not move any money; it only updates our own
 * records once the admin has processed the actual refund manually in the Billplz dashboard.
 */
export async function markPaymentRefunded(bookingId: string): Promise<void> {
  const paymentSnap = await db.collection(COLLECTION).where('bookingId', '==', bookingId).limit(1).get();
  if (paymentSnap.empty) {
    throw new AppError(404, 'No payment found for this booking', 'PAYMENT_NOT_FOUND');
  }

  const paymentDoc = paymentSnap.docs[0];
  const payment = paymentDoc.data() as Payment;
  if (payment.status !== 'paid') {
    throw new AppError(409, 'Only a paid booking can be marked as refunded', 'NOT_PAID');
  }

  await db.runTransaction(async (tx) => {
    tx.update(paymentDoc.ref, { status: 'refunded' satisfies PaymentStatus, updatedAt: Timestamp.now() });
    tx.update(db.collection('bookings').doc(bookingId), {
      status: 'cancelled' satisfies BookingStatus,
      paymentStatus: 'refunded' satisfies PaymentStatus,
      updatedAt: Timestamp.now(),
    });
  });
}
