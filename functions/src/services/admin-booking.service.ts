import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../config/firebase';
import { AppError } from '../utils/app-error';
import { bookingHoldsAllNights, releaseBookingNights } from './booking.service';
import type { Booking, BookingStatus, PaymentStatus } from '../types/booking.types';

const COLLECTION = 'bookings';
const LIST_LIMIT = 200;

export interface AdminBookingView extends Booking {
  /** True when a gateway payment for this booking is paid — such bookings are refunded, not cancelled. */
  paidOnline: boolean;
}

/** Newest first. Ordered by a single field, so it needs no composite index. */
export async function listBookings(): Promise<AdminBookingView[]> {
  const [bookingsSnap, paidSnap] = await Promise.all([
    db.collection(COLLECTION).orderBy('createdAt', 'desc').limit(LIST_LIMIT).get(),
    db.collection('payments').where('status', '==', 'paid').get(),
  ]);
  const paidBookingIds = new Set(paidSnap.docs.map((doc) => doc.data()['bookingId'] as string));

  return bookingsSnap.docs.map((doc) => {
    const booking = doc.data() as Booking;
    return { ...booking, paidOnline: paidBookingIds.has(booking.id) };
  });
}

/**
 * Confirms a pending booking whose payment the owner has received outside the gateway (bank
 * transfer, cash, WhatsApp). This is the owner's assertion — it records no gateway payment.
 * Refused if the booking's dates were already released (e.g. its hold expired and someone
 * else booked them): confirming it would double-book those nights.
 */
export async function confirmBookingManually(bookingId: string): Promise<void> {
  const ref = db.collection(COLLECTION).doc(bookingId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new AppError(404, 'Booking not found', 'BOOKING_NOT_FOUND');
    }
    const booking = snap.data() as Booking;
    if (booking.status !== 'pending_payment') {
      throw new AppError(409, 'Only a booking awaiting payment can be confirmed', 'BOOKING_NOT_PENDING');
    }
    if (!(await bookingHoldsAllNights(tx, booking))) {
      throw new AppError(409, 'These dates are no longer held for this booking', 'BOOKING_DATES_LOST');
    }

    tx.update(ref, {
      status: 'confirmed' satisfies BookingStatus,
      paymentStatus: 'paid' satisfies PaymentStatus,
      holdExpiresAt: null,
      updatedAt: Timestamp.now(),
    });
  });
}

/**
 * Cancels a pending or confirmed booking and frees its dates. A booking with a paid online
 * payment is refused: cancelling it here would hide a payment that still needs refunding, so
 * the owner must use the refund action, which cancels and records the refund together.
 */
export async function cancelBooking(bookingId: string): Promise<void> {
  const ref = db.collection(COLLECTION).doc(bookingId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new AppError(404, 'Booking not found', 'BOOKING_NOT_FOUND');
    }
    const booking = snap.data() as Booking;
    if (booking.status !== 'pending_payment' && booking.status !== 'confirmed') {
      throw new AppError(409, 'This booking can no longer be cancelled', 'BOOKING_NOT_CANCELLABLE');
    }

    // Inside the transaction so a webhook can't mark it paid between this check and the cancel.
    const paidPayments = await tx.get(
      db.collection('payments').where('bookingId', '==', bookingId).where('status', '==', 'paid').limit(1)
    );
    if (!paidPayments.empty) {
      throw new AppError(
        409,
        'This booking has a paid online payment — use refund instead of cancel',
        'PAYMENT_PAID_USE_REFUND'
      );
    }

    await releaseBookingNights(tx, booking);
    tx.update(ref, {
      status: 'cancelled' satisfies BookingStatus,
      holdExpiresAt: null,
      updatedAt: Timestamp.now(),
    });
  });
}
