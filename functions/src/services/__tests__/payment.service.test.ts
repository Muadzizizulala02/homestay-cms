import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'node:crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../../config/firebase';
import { createBooking } from '../booking.service';
import {
  createPaymentForBooking,
  handleToyyibPayWebhook,
  markPaymentRefunded,
  verifyToyyibPaySignature,
} from '../payment.service';
import { AppError } from '../../utils/app-error';
import type { Accommodation } from '../../types/accommodation.types';
import type { GuestDetails } from '../../types/booking.types';

const REQUIRED_ENV = {
  TOYYIBPAY_SECRET_KEY: 'test-secret-key',
  TOYYIBPAY_CATEGORY_CODE: 'test-category',
  TOYYIBPAY_BASE_URL: 'https://dev.toyyibpay.com',
  FRONTEND_BASE_URL: 'https://example.test',
  API_BASE_URL: 'https://api.example.test',
};

/** Mirrors payment.service's own algorithm, used here only to construct valid test payloads. */
function signPayload(
  fields: { status: string; order_id: string; refno: string },
  key = REQUIRED_ENV.TOYYIBPAY_SECRET_KEY
): string {
  return crypto.createHash('md5').update(`${key}${fields.status}${fields.order_id}${fields.refno}ok`).digest('hex');
}

/** Unique per call — this suite runs against a real, persistent Firestore instance (not a
 * fresh one per run), so a fixed literal bill code would collide with a doc left over from a
 * previous run and silently update the wrong record. */
function uniqueBillCode(): string {
  return `bill-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

describe('verifyToyyibPaySignature', () => {
  beforeEach(() => {
    Object.assign(process.env, REQUIRED_ENV);
  });

  it('accepts a correctly signed payload', () => {
    const fields = { status: '1', order_id: 'BK-123', refno: 'ref-abc' };
    const hash = signPayload(fields);
    expect(verifyToyyibPaySignature({ ...fields, hash })).toBe(true);
  });

  it('rejects a payload with a tampered field', () => {
    const fields = { status: '1', order_id: 'BK-123', refno: 'ref-abc' };
    const hash = signPayload(fields);
    expect(verifyToyyibPaySignature({ ...fields, status: '3', hash })).toBe(false);
  });

  it('rejects a payload with no hash', () => {
    expect(verifyToyyibPaySignature({ status: '1', order_id: 'BK-123', refno: 'ref-abc' })).toBe(false);
  });
});

describe('createPaymentForBooking', () => {
  let billCode: string;

  beforeEach(() => {
    billCode = uniqueBillCode();
    Object.assign(process.env, REQUIRED_ENV);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ BillCode: billCode }],
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a ToyyibPay bill and records a pending payment', async () => {
    const booking = await seedPendingBooking();
    const result = await createPaymentForBooking(booking.id);

    expect(result.redirectUrl).toBe(`https://dev.toyyibpay.com/${billCode}`);
    expect(fetch).toHaveBeenCalledTimes(1);

    const paymentSnap = await db.collection('payments').where('bookingId', '==', booking.id).limit(1).get();
    expect(paymentSnap.empty).toBe(false);
    expect(paymentSnap.docs[0].data()['gatewayBillId']).toBe(billCode);
    expect(paymentSnap.docs[0].data()['status']).toBe('pending');
    expect(paymentSnap.docs[0].data()['gateway']).toBe('toyyibpay');
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

  it('throws a clear gateway error if ToyyibPay does not return a bill code', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [{}] }));
    const booking = await seedPendingBooking();
    await expect(createPaymentForBooking(booking.id)).rejects.toThrow(AppError);
  });
});

describe('handleToyyibPayWebhook', () => {
  let billCode: string;

  beforeEach(() => {
    billCode = uniqueBillCode();
    Object.assign(process.env, REQUIRED_ENV);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ BillCode: billCode }],
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('confirms the booking and marks the payment paid on a valid status=1 callback', async () => {
    const booking = await seedPendingBooking();
    await createPaymentForBooking(booking.id);

    const fields = { status: '1', order_id: booking.reference, refno: 'ref-1' };
    await handleToyyibPayWebhook({ ...fields, billcode: billCode, amount: '30000', hash: signPayload(fields) });

    const bookingDoc = await db.collection('bookings').doc(booking.id).get();
    expect(bookingDoc.data()?.['status']).toBe('confirmed');
    expect(bookingDoc.data()?.['paymentStatus']).toBe('paid');

    const paymentSnap = await db.collection('payments').where('bookingId', '==', booking.id).limit(1).get();
    expect(paymentSnap.docs[0].data()['status']).toBe('paid');
  });

  it('marks the payment failed on a valid status=3 callback, without confirming the booking', async () => {
    const booking = await seedPendingBooking();
    await createPaymentForBooking(booking.id);

    const fields = { status: '3', order_id: booking.reference, refno: 'ref-2' };
    await handleToyyibPayWebhook({ ...fields, billcode: billCode, amount: '30000', hash: signPayload(fields) });

    const bookingDoc = await db.collection('bookings').doc(booking.id).get();
    expect(bookingDoc.data()?.['status']).toBe('pending_payment');
    expect(bookingDoc.data()?.['paymentStatus']).toBe('failed');
  });

  it('rejects a callback with an invalid hash', async () => {
    const booking = await seedPendingBooking();
    await createPaymentForBooking(booking.id);

    await expect(
      handleToyyibPayWebhook({
        status: '1',
        order_id: booking.reference,
        refno: 'ref-3',
        billcode: billCode,
        amount: '30000',
        hash: 'not-a-real-hash',
      })
    ).rejects.toThrow(AppError);

    const bookingDoc = await db.collection('bookings').doc(booking.id).get();
    expect(bookingDoc.data()?.['status']).toBe('pending_payment'); // unchanged
  });

  it('does nothing for a hash-valid callback referencing an unknown bill', async () => {
    const fields = { status: '1', order_id: 'unknown', refno: 'ref-4' };
    await expect(
      handleToyyibPayWebhook({
        ...fields,
        billcode: `unknown-${uniqueBillCode()}`,
        amount: '30000',
        hash: signPayload(fields),
      })
    ).resolves.toBeUndefined();
  });
});

describe('markPaymentRefunded', () => {
  let billCode: string;

  beforeEach(() => {
    billCode = uniqueBillCode();
    Object.assign(process.env, REQUIRED_ENV);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ BillCode: billCode }],
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('marks a paid booking as refunded and cancels it', async () => {
    const booking = await seedPendingBooking();
    await createPaymentForBooking(booking.id);
    const fields = { status: '1', order_id: booking.reference, refno: 'ref-5' };
    await handleToyyibPayWebhook({ ...fields, billcode: billCode, amount: '30000', hash: signPayload(fields) });

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
