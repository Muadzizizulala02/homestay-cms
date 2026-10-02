import crypto from 'node:crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../config/firebase';
import { env } from '../config/env';
import { AppError } from '../utils/app-error';
import type { Booking, BookingStatus } from '../types/booking.types';
import type { Payment } from '../types/payment.types';
import type { PaymentStatus } from '../types/booking.types';

const COLLECTION = 'payments';

interface CreateToyyibPayBillInput {
  amountInCents: number;
  email: string;
  name: string;
  phone: string;
  description: string;
  reference: string;
}

async function createToyyibPayBill(input: CreateToyyibPayBillInput): Promise<{ billCode: string; url: string }> {
  const body = new URLSearchParams({
    userSecretKey: env.toyyibpaySecretKey,
    categoryCode: env.toyyibpayCategoryCode,
    billName: input.reference.slice(0, 30),
    billDescription: input.description.slice(0, 100),
    billPriceSetting: '1', // fixed amount, not guest-entered
    billPayorInfo: '1', // require name/email/phone
    billAmount: String(input.amountInCents),
    billReturnUrl: `${env.frontendBaseUrl}/booking/confirmation?reference=${encodeURIComponent(input.reference)}`,
    billCallbackUrl: `${env.apiBaseUrl}/api/v1/payments/webhook/toyyibpay`,
    billExternalReferenceNo: input.reference,
    billTo: input.name,
    billEmail: input.email,
    billPhone: input.phone,
    billPaymentChannel: '2', // FPX + card
  });

  const res = await fetch(`${env.toyyibpayBaseUrl}/index.php/api/createBill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    throw new AppError(502, 'Could not create a payment with the gateway', 'PAYMENT_GATEWAY_ERROR');
  }

  // ToyyibPay responds with a JSON array, e.g. [{ "BillCode": "abc123" }].
  const data = (await res.json()) as Array<{ BillCode?: string }>;
  const billCode = data[0]?.BillCode;
  if (!billCode) {
    throw new AppError(502, 'Payment gateway did not return a bill code', 'PAYMENT_GATEWAY_ERROR');
  }

  return { billCode, url: `${env.toyyibpayBaseUrl}/${billCode}` };
}

/**
 * Creates (or reuses) a ToyyibPay bill for a pending_payment booking and records it in
 * `payments`. Deliberately not part of the booking-creation transaction: an external HTTP
 * call inside a Firestore transaction risks creating duplicate bills if the transaction retries.
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
      // Reuse the bill already created rather than creating a duplicate at ToyyibPay.
      return { redirectUrl: `${env.toyyibpayBaseUrl}/${existing.gatewayBillId}` };
    }
  }

  const bill = await createToyyibPayBill({
    amountInCents: Math.round(booking.price.total * 100),
    email: booking.guest.email,
    name: booking.guest.name,
    phone: booking.guest.phone,
    description: `Booking ${booking.reference}`,
    reference: booking.reference,
  });

  const paymentRef = db.collection(COLLECTION).doc();
  const now = Timestamp.now();
  const payment: Payment = {
    id: paymentRef.id,
    bookingId,
    gateway: 'toyyibpay',
    gatewayBillId: bill.billCode,
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
 * Verifies a ToyyibPay callback: hash = MD5(secretKey + status + order_id + refno + "ok").
 * Weaker than an HMAC (MD5 is an older, collision-prone hash) but still a real integrity check
 * tied to a secret only we and ToyyibPay know — this, not the browser return URL, is the only
 * thing that may ever flip a payment to `paid`.
 */
export function verifyToyyibPaySignature(payload: Record<string, string>): boolean {
  const { hash: providedHash, status, order_id: orderId, refno } = payload;
  if (!providedHash || status === undefined || orderId === undefined || refno === undefined) {
    return false;
  }

  const expected = crypto
    .createHash('md5')
    .update(`${env.toyyibpaySecretKey}${status}${orderId}${refno}ok`)
    .digest('hex');

  const expectedBuffer = Buffer.from(expected, 'hex');
  const providedBuffer = Buffer.from(providedHash, 'hex');
  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

/** Handles ToyyibPay's server-to-server callback. status: 1=success, 2=pending, 3=fail. */
export async function handleToyyibPayWebhook(payload: Record<string, string>): Promise<void> {
  if (!verifyToyyibPaySignature(payload)) {
    throw new AppError(401, 'Invalid webhook signature', 'INVALID_SIGNATURE');
  }

  const paymentSnap = await db
    .collection(COLLECTION)
    .where('gatewayBillId', '==', payload['billcode'])
    .limit(1)
    .get();
  if (paymentSnap.empty) {
    // Unknown bill — acknowledge quietly rather than erroring; nothing useful to report.
    return;
  }

  const paymentDoc = paymentSnap.docs[0];
  const payment = paymentDoc.data() as Payment;
  const isPaid = payload['status'] === '1';
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
 * Records a booking's payment as refunded. ToyyibPay has no publicly documented refund API
 * (their Terms of Service describe refunds as a merchant-initiated instruction they may decline,
 * not an API call) — this does not move any money; it only updates our own records once the
 * admin has processed the actual refund through ToyyibPay themselves.
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
