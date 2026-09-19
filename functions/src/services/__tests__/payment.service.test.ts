import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'node:crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../../config/firebase';
import { createBooking } from '../booking.service';
import {
  createPaymentForBooking,
  handleBillplzWebhook,
  markPaymentRefunded,
  verifyBillplzSignature,
} from '../payment.service';
import { AppError } from '../../utils/app-error';
import type { Accommodation } from '../../types/accommodation.types';
import type { GuestDetails } from '../../types/booking.types';

const REQUIRED_ENV = {
  BILLPLZ_SECRET_KEY: 'test-secret-key',
  BILLPLZ_COLLECTION_ID: 'test-collection',
  BILLPLZ_X_SIGNATURE_KEY: 'test-x-signature-key',
  BILLPLZ_BASE_URL: 'https://www.billplz-sandbox.com',
  FRONTEND_BASE_URL: 'https://example.test',
  API_BASE_URL: 'https://api.example.test',
};

/** Mirrors payment.service's own algorithm, used here only to construct valid test payloads. */
function signPayload(fields: Record<string, string>, key = REQUIRED_ENV.BILLPLZ_X_SIGNATURE_KEY): string {
  const sortedKeys = Object.keys(fields).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const sourceString = sortedKeys.map((k) => `${k}${fields[k]}`).join('|');
  return crypto.createHmac('sha256', key).update(sourceString).digest('hex');
}

/** Unique per call — this suite runs against a real, persistent Firestore instance (not a
 * fresh one per run), so a fixed literal bill id would collide with a doc left over from a
 * previous run and silently update the wrong record. */
function uniqueBillId(): string {
  return `bp-bill-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function seedAccommodation(overrides: Partial<Accommodation> = {}): Promise<string> {
  const ref = db.collection('accommodations').doc();
  const data: Accommodation = {
    id: ref.id,
    slug: `unit-${ref.id}`,
    name: 'Test Room',
    description: '',
    photos: [],
    capacity: 4,
    beds: 2,
    amenities: [],
    basePrice: 150,
    minStay: 1,
    maxStay: 14,
    active: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
  };
  await ref.set(data);
  return ref.id;
}

const guest: GuestDetails = { name: 'Test Guest', email: 'guest@example.com', phone: '+60123456789' };

async function seedPendingBooking() {
  const accommodationId = await seedAccommodation();
  return createBooking({
    accommodationId,
    checkInDate: '2027-05-01',
    checkOutDate: '2027-05-03',
    guestCount: 2,
    guest,
  });
}

describe('verifyBillplzSignature', () => {
  beforeEach(() => {
    Object.assign(process.env, REQUIRED_ENV);
  });

  it('accepts a correctly signed payload', () => {
    const fields = { id: 'bill123', paid: 'true', amount: '30000' };
    const x_signature = signPayload(fields);
    expect(verifyBillplzSignature({ ...fields, x_signature })).toBe(true);
  });

  it('rejects a payload with a tampered field', () => {
    const fields = { id: 'bill123', paid: 'true', amount: '30000' };
    const x_signature = signPayload(fields);
    expect(verifyBillplzSignature({ ...fields, amount: '1', x_signature })).toBe(false);
  });

  it('rejects a payload with no signature', () => {
    expect(verifyBillplzSignature({ id: 'bill123', paid: 'true' })).toBe(false);
  });
});

describe('createPaymentForBooking', () => {
  let billId: string;

  beforeEach(() => {
    billId = uniqueBillId();
    Object.assign(process.env, REQUIRED_ENV);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: billId, url: `https://www.billplz-sandbox.com/bills/${billId}` }),
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a Billplz bill and records a pending payment', async () => {
    const booking = await seedPendingBooking();
    const result = await createPaymentForBooking(booking.id);

    expect(result.redirectUrl).toBe(`https://www.billplz-sandbox.com/bills/${billId}`);
    expect(fetch).toHaveBeenCalledTimes(1);

    const paymentSnap = await db.collection('payments').where('bookingId', '==', booking.id).limit(1).get();
    expect(paymentSnap.empty).toBe(false);
    expect(paymentSnap.docs[0].data()['gatewayBillId']).toBe(billId);
    expect(paymentSnap.docs[0].data()['status']).toBe('pending');
  });

  it('reuses the existing pending payment instead of creating a duplicate bill', async () => {
    const booking = await seedPendingBooking();
    await createPaymentForBooking(booking.id);
    await createPaymentForBooking(booking.id);

    expect(fetch).toHaveBeenCalledTimes(1);
    const paymentSnap = await db.collection('payments').where('bookingId', '==', booking.id).get();
    expect(paymentSnap.docs).toHaveLength(1);
  });

  it('rejects a booking that is not awaiting payment', async () => {
    await expect(createPaymentForBooking('does-not-exist')).rejects.toThrow(AppError);
  });
});

describe('handleBillplzWebhook', () => {
  let billId: string;

  beforeEach(() => {
    billId = uniqueBillId();
    Object.assign(process.env, REQUIRED_ENV);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: billId, url: `https://www.billplz-sandbox.com/bills/${billId}` }),
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('confirms the booking and marks the payment paid on a valid paid=true callback', async () => {
    const booking = await seedPendingBooking();
    await createPaymentForBooking(booking.id);

    const fields = { id: billId, paid: 'true', amount: '30000', paid_at: '2027-05-01 10:00:00' };
    await handleBillplzWebhook({ ...fields, x_signature: signPayload(fields) });

    const bookingDoc = await db.collection('bookings').doc(booking.id).get();
    expect(bookingDoc.data()?.['status']).toBe('confirmed');
    expect(bookingDoc.data()?.['paymentStatus']).toBe('paid');

    const paymentSnap = await db.collection('payments').where('bookingId', '==', booking.id).limit(1).get();
    expect(paymentSnap.docs[0].data()['status']).toBe('paid');
  });

  it('marks the payment failed on a valid paid=false callback, without confirming the booking', async () => {
    const booking = await seedPendingBooking();
    await createPaymentForBooking(booking.id);

    const fields = { id: billId, paid: 'false', amount: '30000' };
    await handleBillplzWebhook({ ...fields, x_signature: signPayload(fields) });

    const bookingDoc = await db.collection('bookings').doc(booking.id).get();
    expect(bookingDoc.data()?.['status']).toBe('pending_payment');
    expect(bookingDoc.data()?.['paymentStatus']).toBe('failed');
  });

  it('rejects a callback with an invalid signature', async () => {
    const booking = await seedPendingBooking();
    await createPaymentForBooking(booking.id);

    await expect(
      handleBillplzWebhook({ id: billId, paid: 'true', amount: '30000', x_signature: 'not-a-real-signature' })
    ).rejects.toThrow(AppError);

    const bookingDoc = await db.collection('bookings').doc(booking.id).get();
    expect(bookingDoc.data()?.['status']).toBe('pending_payment'); // unchanged
  });

  it('does nothing for a signature-valid callback referencing an unknown bill', async () => {
    const fields = { id: `unknown-${uniqueBillId()}`, paid: 'true', amount: '30000' };
    await expect(handleBillplzWebhook({ ...fields, x_signature: signPayload(fields) })).resolves.toBeUndefined();
  });
});

describe('markPaymentRefunded', () => {
  let billId: string;

  beforeEach(() => {
    billId = uniqueBillId();
    Object.assign(process.env, REQUIRED_ENV);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: billId, url: `https://www.billplz-sandbox.com/bills/${billId}` }),
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('marks a paid booking as refunded and cancels it', async () => {
    const booking = await seedPendingBooking();
    await createPaymentForBooking(booking.id);
    const fields = { id: billId, paid: 'true', amount: '30000' };
    await handleBillplzWebhook({ ...fields, x_signature: signPayload(fields) });

    await markPaymentRefunded(booking.id);

    const bookingDoc = await db.collection('bookings').doc(booking.id).get();
    expect(bookingDoc.data()?.['status']).toBe('cancelled');
    expect(bookingDoc.data()?.['paymentStatus']).toBe('refunded');
  });

  it('rejects refunding a booking that was never paid', async () => {
    const booking = await seedPendingBooking();
    await createPaymentForBooking(booking.id);
    await expect(markPaymentRefunded(booking.id)).rejects.toThrow(AppError);
  });

  it('404s for a booking with no payment at all', async () => {
    await expect(markPaymentRefunded('does-not-exist')).rejects.toThrow(AppError);
  });
});
