import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../../config/firebase';
import { createBooking, type CreateBookingInput } from '../booking.service';
import { cancelBooking, confirmBookingManually, listBookings } from '../admin-booking.service';
import { AppError } from '../../utils/app-error';
import type { Accommodation } from '../../types/accommodation.types';
import type { GuestDetails } from '../../types/booking.types';

async function seedAccommodation(): Promise<string> {
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
  };
  await ref.set(data);
  return ref.id;
}

const guest: GuestDetails = { name: 'Admin Test Guest', email: 'guest@example.com', phone: '+60123456789' };

function bookingInput(accommodationId: string, checkInDate: string, checkOutDate: string): CreateBookingInput {
  return { accommodationId, checkInDate, checkOutDate, guestCount: 2, guest };
}

async function nightExists(accommodationId: string, date: string): Promise<boolean> {
  const snap = await db.collection('accommodations').doc(accommodationId).collection('availability').doc(date).get();
  return snap.exists;
}

describe('listBookings', () => {
  it('returns bookings newest first', async () => {
    const accommodationId = await seedAccommodation();
    const first = await createBooking(bookingInput(accommodationId, '2028-01-01', '2028-01-02'));
    const second = await createBooking(bookingInput(accommodationId, '2028-01-05', '2028-01-06'));

    const ids = (await listBookings()).map((b) => b.id);

    expect(ids.indexOf(second.id)).toBeGreaterThanOrEqual(0);
    expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id));
  });
});

describe('listBookings paidOnline flag', () => {
  it('is true only for bookings backed by a paid gateway payment', async () => {
    const accommodationId = await seedAccommodation();
    const online = await createBooking(bookingInput(accommodationId, '2028-08-01', '2028-08-02'));
    const manual = await createBooking(bookingInput(accommodationId, '2028-08-05', '2028-08-06'));
    await db.collection('payments').doc().set({
      bookingId: online.id,
      gateway: 'toyyibpay',
      status: 'paid',
      createdAt: Timestamp.now(),
    });
    await confirmBookingManually(manual.id);

    const list = await listBookings();

    expect(list.find((b) => b.id === online.id)?.paidOnline).toBe(true);
    expect(list.find((b) => b.id === manual.id)?.paidOnline).toBe(false);
  });
});

describe('confirmBookingManually', () => {
  it('confirms a pending booking as paid and removes its hold expiry', async () => {
    const accommodationId = await seedAccommodation();
    const booking = await createBooking(bookingInput(accommodationId, '2028-02-01', '2028-02-03'));

    await confirmBookingManually(booking.id);

    const data = (await db.collection('bookings').doc(booking.id).get()).data();
    expect(data?.['status']).toBe('confirmed');
    expect(data?.['paymentStatus']).toBe('paid');
    expect(data?.['holdExpiresAt']).toBeNull();
    expect(await nightExists(accommodationId, '2028-02-01')).toBe(true);
  });

  it('rejects confirming a booking that is not pending', async () => {
    const accommodationId = await seedAccommodation();
    const booking = await createBooking(bookingInput(accommodationId, '2028-03-01', '2028-03-03'));
    await cancelBooking(booking.id);

    await expect(confirmBookingManually(booking.id)).rejects.toMatchObject({ code: 'BOOKING_NOT_PENDING' });
  });

  it('404s for an unknown booking', async () => {
    await expect(confirmBookingManually('does-not-exist')).rejects.toThrow(AppError);
  });

  it('refuses to confirm a booking whose dates are no longer held for it', async () => {
    const accommodationId = await seedAccommodation();
    const booking = await createBooking(bookingInput(accommodationId, '2028-09-01', '2028-09-03'));
    await db
      .collection('accommodations')
      .doc(accommodationId)
      .collection('availability')
      .doc('2028-09-01')
      .delete();

    await expect(confirmBookingManually(booking.id)).rejects.toMatchObject({ code: 'BOOKING_DATES_LOST' });
    expect((await db.collection('bookings').doc(booking.id).get()).data()?.['status']).toBe('pending_payment');
  });
});

describe('cancelBooking', () => {
  it('cancels a pending booking and frees its nights for rebooking', async () => {
    const accommodationId = await seedAccommodation();
    const booking = await createBooking(bookingInput(accommodationId, '2028-04-01', '2028-04-03'));

    await cancelBooking(booking.id);

    const data = (await db.collection('bookings').doc(booking.id).get()).data();
    expect(data?.['status']).toBe('cancelled');
    expect(data?.['holdExpiresAt']).toBeNull();
    expect(await nightExists(accommodationId, '2028-04-01')).toBe(false);

    const rebooked = await createBooking(bookingInput(accommodationId, '2028-04-01', '2028-04-03'));
    expect(rebooked.status).toBe('pending_payment');
  });

  it('cancels a manually confirmed booking too', async () => {
    const accommodationId = await seedAccommodation();
    const booking = await createBooking(bookingInput(accommodationId, '2028-05-01', '2028-05-03'));
    await confirmBookingManually(booking.id);

    await cancelBooking(booking.id);

    expect((await db.collection('bookings').doc(booking.id).get()).data()?.['status']).toBe('cancelled');
    expect(await nightExists(accommodationId, '2028-05-01')).toBe(false);
  });

  it('is rejected once already cancelled', async () => {
    const accommodationId = await seedAccommodation();
    const booking = await createBooking(bookingInput(accommodationId, '2028-06-01', '2028-06-03'));
    await cancelBooking(booking.id);

    await expect(cancelBooking(booking.id)).rejects.toMatchObject({ code: 'BOOKING_NOT_CANCELLABLE' });
  });

  it('refuses to cancel a booking with a paid online payment — it must go through refund', async () => {
    const accommodationId = await seedAccommodation();
    const booking = await createBooking(bookingInput(accommodationId, '2028-07-01', '2028-07-03'));
    await db.collection('payments').doc().set({
      bookingId: booking.id,
      gateway: 'toyyibpay',
      status: 'paid',
      createdAt: Timestamp.now(),
    });
    await db.collection('bookings').doc(booking.id).update({ status: 'confirmed', paymentStatus: 'paid' });

    await expect(cancelBooking(booking.id)).rejects.toMatchObject({ code: 'PAYMENT_PAID_USE_REFUND' });
  });
});
