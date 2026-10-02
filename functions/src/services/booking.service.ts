import { logger } from 'firebase-functions';
import { Timestamp, type DocumentReference, type Transaction } from 'firebase-admin/firestore';
import { db } from '../config/firebase';
import { env } from '../config/env';
import { AppError } from '../utils/app-error';
import { calculatePrice, enumerateNightsForRange } from './pricing.service';
import type { Accommodation, AvailabilityStatus } from '../types/accommodation.types';
import type { Booking, BookingStatus, GuestDetails } from '../types/booking.types';

const HOLD_DURATION_MS = 20 * 60 * 1000; // 20 minutes — the guest is paying right now
// With online payment off the owner follows up by hand, which takes far longer than a checkout.
const MANUAL_PAYMENT_HOLD_DURATION_MS = 48 * 60 * 60 * 1000;
const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'; // no ambiguous I/O/0/1 mix-ups

export interface CreateBookingInput {
  accommodationId: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  guest: GuestDetails;
}

function generateReference(now: Date = new Date()): string {
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  let suffix = '';
  for (let i = 0; i < 4; i += 1) {
    suffix += REFERENCE_ALPHABET[Math.floor(Math.random() * REFERENCE_ALPHABET.length)];
  }
  return `BK-${datePart}-${suffix}`;
}

/**
 * Creates a booking and atomically locks every requested night.
 *
 * Double-booking prevention (see docs/DATABASE.md): each night is its own document at
 * accommodations/{id}/availability/{YYYY-MM-DD}. `transaction.create()` fails the whole
 * transaction if that document already exists, so two concurrent attempts to book an
 * overlapping range can never both succeed — Firestore enforces the mutual exclusion,
 * not application-level locking.
 */
export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const accommodationRef = db.collection('accommodations').doc(input.accommodationId);

  try {
    return await db.runTransaction(async (tx) => {
      const accommodationSnap = await tx.get(accommodationRef);
      if (!accommodationSnap.exists) {
        throw new AppError(404, 'Accommodation not found', 'ACCOMMODATION_NOT_FOUND');
      }

      const accommodation = accommodationSnap.data() as Accommodation;
      if (!accommodation.active) {
        throw new AppError(404, 'Accommodation not found', 'ACCOMMODATION_NOT_FOUND');
      }
      if (input.guestCount < 1 || input.guestCount > accommodation.capacity) {
        throw new AppError(
          400,
          `Guest count must be between 1 and ${accommodation.capacity}`,
          'INVALID_GUEST_COUNT'
        );
      }

      const price = calculatePrice(accommodation, input.checkInDate, input.checkOutDate);
      const nights = enumerateNightsForRange(input.checkInDate, input.checkOutDate);

      const bookingRef = db.collection('bookings').doc();
      const now = Timestamp.now();
      const booking: Booking = {
        id: bookingRef.id,
        reference: generateReference(),
        accommodationId: input.accommodationId,
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate,
        guestCount: input.guestCount,
        guest: input.guest,
        price,
        status: 'pending_payment',
        paymentStatus: 'pending',
        holdExpiresAt: Timestamp.fromMillis(
          Date.now() + (env.paymentEnabled ? HOLD_DURATION_MS : MANUAL_PAYMENT_HOLD_DURATION_MS)
        ),
        createdAt: now,
        updatedAt: now,
      };

      // All reads (above) happen before any writes, per Firestore transaction rules.
      tx.set(bookingRef, booking);

      for (const date of nights) {
        const availabilityRef = accommodationRef.collection('availability').doc(date);
        tx.create(availabilityRef, {
          status: 'booked' satisfies AvailabilityStatus,
          bookingId: bookingRef.id,
          createdAt: Timestamp.now(),
        });
      }

      return booking;
    });
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    // A transaction can also fail because a night's availability doc already existed
    // (create() precondition) or because of contention with a concurrent booking attempt.
    throw new AppError(409, 'One or more selected dates are no longer available', 'DATES_UNAVAILABLE');
  }
}

/** Returns only the dates in range that are already taken, keyed by date. */
export async function getAvailability(
  accommodationId: string,
  fromDate: string,
  toDate: string
): Promise<Record<string, AvailabilityStatus>> {
  const dates = enumerateNightsForRange(fromDate, toDate);
  const snaps = await Promise.all(
    dates.map((date) =>
      db.collection('accommodations').doc(accommodationId).collection('availability').doc(date).get()
    )
  );

  const result: Record<string, AvailabilityStatus> = {};
  snaps.forEach((snap, index) => {
    if (snap.exists) {
      result[dates[index]] = snap.data()?.status as AvailabilityStatus;
    }
  });
  return result;
}

/**
 * Guest-facing, no-account lookup — a booking reference alone isn't sufficient to view a
 * booking, since references are short and somewhat guessable; requiring the guest's own
 * email as well means someone else's reference can't be used to snoop on their booking.
 */
export async function getBookingByReferenceAndEmail(reference: string, email: string): Promise<Booking> {
  const snap = await db
    .collection('bookings')
    .where('reference', '==', reference)
    .where('guest.email', '==', email)
    .limit(1)
    .get();

  if (snap.empty) {
    throw new AppError(404, 'Booking not found', 'BOOKING_NOT_FOUND');
  }

  return snap.docs[0].data() as Booking;
}

function bookingNightRefs(booking: Booking): DocumentReference[] {
  const availability = db.collection('accommodations').doc(booking.accommodationId).collection('availability');
  return enumerateNightsForRange(booking.checkInDate, booking.checkOutDate).map((date) => availability.doc(date));
}

/**
 * Reads the booking's night documents and returns only those this booking still owns.
 * A night can legitimately belong to someone else: once a hold expires or a booking is
 * cancelled its nights are freed and may be rebooked, so a stale booking must never be
 * treated as owning (or be allowed to delete) dates that now belong to another guest.
 * Must run before any write in the transaction.
 */
export async function readOwnedNights(tx: Transaction, booking: Booking): Promise<DocumentReference[]> {
  const refs = bookingNightRefs(booking);
  const snaps = await tx.getAll(...refs);
  return snaps.filter((snap) => snap.exists && snap.data()?.['bookingId'] === booking.id).map((snap) => snap.ref);
}

/** True if every night of the booking is still held by it (i.e. its dates were not released). */
export async function bookingHoldsAllNights(tx: Transaction, booking: Booking): Promise<boolean> {
  return (await readOwnedNights(tx, booking)).length === bookingNightRefs(booking).length;
}

/**
 * Frees the nights this booking owns, inside an existing transaction, so they can be booked
 * again. Shared by expiry, admin cancellation and refunds. Reads before it deletes, so call it
 * before any `tx.update`/`tx.set` in the same transaction.
 */
export async function releaseBookingNights(tx: Transaction, booking: Booking): Promise<void> {
  for (const ref of await readOwnedNights(tx, booking)) {
    tx.delete(ref);
  }
}

/**
 * Sweeps pending bookings whose hold has expired, flips them to `expired`, and releases
 * their nights so abandoned checkouts don't permanently lock inventory. Runs on a schedule
 * (`expireStaleBookings` in index.ts).
 */
export async function expireStalePendingBookings(now: Date = new Date()): Promise<number> {
  const staleSnap = await db
    .collection('bookings')
    .where('status', '==', 'pending_payment')
    .where('holdExpiresAt', '<=', Timestamp.fromDate(now))
    .get();

  let expiredCount = 0;

  for (const doc of staleSnap.docs) {
    try {
      const expired = await db.runTransaction(async (tx) => {
        // Re-read inside the transaction: a payment webhook may have confirmed this booking
        // after the query above ran, and a paid booking must never be expired.
        const fresh = await tx.get(doc.ref);
        const booking = fresh.data() as Booking | undefined;
        if (!booking || booking.status !== 'pending_payment') {
          return false;
        }

        await releaseBookingNights(tx, booking);
        tx.update(doc.ref, {
          status: 'expired' satisfies BookingStatus,
          holdExpiresAt: null,
          updatedAt: Timestamp.now(),
        });
        return true;
      });
      if (expired) {
        expiredCount += 1;
      }
    } catch (err) {
      // One bad booking must not stop the rest of the sweep; it is retried on the next run.
      logger.error('Failed to expire booking', { bookingId: doc.id, err });
    }
  }

  return expiredCount;
}
