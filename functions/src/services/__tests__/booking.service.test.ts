import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../../config/firebase';
import {
  createBooking,
  expireStalePendingBookings,
  getAvailability,
  getBookingByReferenceAndEmail,
  type CreateBookingInput,
} from '../booking.service';
import { AppError } from '../../utils/app-error';
import type { Accommodation } from '../../types/accommodation.types';
import type { GuestDetails } from '../../types/booking.types';

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

function bookingInput(accommodationId: string, overrides: Partial<CreateBookingInput> = {}): CreateBookingInput {
  return {
    accommodationId,
    checkInDate: '2026-11-01',
    checkOutDate: '2026-11-03',
    guestCount: 2,
    guest,
    ...overrides,
  };
}

describe('createBooking', () => {
  it('creates a pending_payment booking and locks the requested nights', async () => {
    const accommodationId = await seedAccommodation();
    const booking = await createBooking(bookingInput(accommodationId));

    expect(booking.status).toBe('pending_payment');
    expect(booking.paymentStatus).toBe('pending');
    expect(booking.reference).toMatch(/^BK-\d{8}-[A-Z0-9]{4}$/);
    expect(booking.price.total).toBe(300);

    const nightDoc = await db
      .collection('accommodations')
      .doc(accommodationId)
      .collection('availability')
      .doc('2026-11-01')
      .get();
    expect(nightDoc.exists).toBe(true);
    expect(nightDoc.data()?.status).toBe('booked');
    expect(nightDoc.data()?.bookingId).toBe(booking.id);
  });

  it('rejects a booking that overlaps an already-booked night', async () => {
    const accommodationId = await seedAccommodation();
    await createBooking(bookingInput(accommodationId, { checkInDate: '2026-11-10', checkOutDate: '2026-11-12' }));

    await expect(
      createBooking(bookingInput(accommodationId, { checkInDate: '2026-11-11', checkOutDate: '2026-11-13' }))
    ).rejects.toThrow(AppError);
  });

  it('allows a booking that starts exactly when another ends (checkout day is not a locked night)', async () => {
    const accommodationId = await seedAccommodation();
    await createBooking(bookingInput(accommodationId, { checkInDate: '2026-11-15', checkOutDate: '2026-11-17' }));

    const second = await createBooking(
      bookingInput(accommodationId, { checkInDate: '2026-11-17', checkOutDate: '2026-11-19' })
    );
    expect(second.status).toBe('pending_payment');
  });

  it('rejects a guest count above capacity', async () => {
    const accommodationId = await seedAccommodation({ capacity: 2 });
    await expect(createBooking(bookingInput(accommodationId, { guestCount: 5 }))).rejects.toThrow(AppError);
  });

  it('rejects a booking for an unknown accommodation', async () => {
    await expect(createBooking(bookingInput('does-not-exist'))).rejects.toThrow(AppError);
  });

  it('rejects a booking for an inactive accommodation', async () => {
    const accommodationId = await seedAccommodation({ active: false });
    await expect(createBooking(bookingInput(accommodationId))).rejects.toThrow(AppError);
  });

  it('allows exactly one of two concurrent overlapping booking attempts to succeed', async () => {
    const accommodationId = await seedAccommodation();
    const attempt = () =>
      createBooking(bookingInput(accommodationId, { checkInDate: '2026-12-01', checkOutDate: '2026-12-04' }));

    const results = await Promise.allSettled([attempt(), attempt()]);
    const fulfilled = results.filter(
      (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof attempt>>> => r.status === 'fulfilled'
    );
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const survivor = fulfilled[0].value;
    for (const date of ['2026-12-01', '2026-12-02', '2026-12-03']) {
      const doc = await db
        .collection('accommodations')
        .doc(accommodationId)
        .collection('availability')
        .doc(date)
        .get();
      expect(doc.data()?.bookingId).toBe(survivor.id);
    }
  });
});

describe('getAvailability', () => {
  it('reports only the nights that are actually taken', async () => {
    const accommodationId = await seedAccommodation();
    await createBooking(bookingInput(accommodationId, { checkInDate: '2026-11-20', checkOutDate: '2026-11-22' }));

    const availability = await getAvailability(accommodationId, '2026-11-19', '2026-11-24');
    expect(availability).toEqual({
      '2026-11-20': 'booked',
      '2026-11-21': 'booked',
    });
  });
});

describe('getBookingByReferenceAndEmail', () => {
  it('finds a booking by matching reference and email', async () => {
    const accommodationId = await seedAccommodation();
    const booking = await createBooking(
      bookingInput(accommodationId, { checkInDate: '2026-11-25', checkOutDate: '2026-11-27' })
    );

    const found = await getBookingByReferenceAndEmail(booking.reference, guest.email);
    expect(found.id).toBe(booking.id);
  });

  it('404s for a mismatched email, even with a valid reference', async () => {
    const accommodationId = await seedAccommodation();
    const booking = await createBooking(
      bookingInput(accommodationId, { checkInDate: '2026-11-28', checkOutDate: '2026-11-30' })
    );

    await expect(getBookingByReferenceAndEmail(booking.reference, 'someone-else@example.com')).rejects.toThrow(
      AppError
    );
  });

  it('404s for an unknown reference', async () => {
    await expect(getBookingByReferenceAndEmail('BK-00000000-ZZZZ', guest.email)).rejects.toThrow(AppError);
  });
});

describe('expireStalePendingBookings', () => {
  it('expires a pending booking past its hold window and frees its nights for rebooking', async () => {
    const accommodationId = await seedAccommodation();
    const booking = await createBooking(
      bookingInput(accommodationId, { checkInDate: '2027-01-01', checkOutDate: '2027-01-03' })
    );

    await db
      .collection('bookings')
      .doc(booking.id)
      .update({ holdExpiresAt: Timestamp.fromMillis(Date.now() - 1000) });

    const expiredCount = await expireStalePendingBookings();
    expect(expiredCount).toBeGreaterThanOrEqual(1);

    const bookingDoc = await db.collection('bookings').doc(booking.id).get();
    expect(bookingDoc.data()?.status).toBe('expired');

    const nightDoc = await db
      .collection('accommodations')
      .doc(accommodationId)
      .collection('availability')
      .doc('2027-01-01')
      .get();
    expect(nightDoc.exists).toBe(false);

    const rebooked = await createBooking(
      bookingInput(accommodationId, { checkInDate: '2027-01-01', checkOutDate: '2027-01-03' })
    );
    expect(rebooked.status).toBe('pending_payment');
  });

  it('leaves bookings whose hold has not expired untouched', async () => {
    const accommodationId = await seedAccommodation();
    const booking = await createBooking(
      bookingInput(accommodationId, { checkInDate: '2027-02-01', checkOutDate: '2027-02-03' })
    );

    await expireStalePendingBookings();

    const bookingDoc = await db.collection('bookings').doc(booking.id).get();
    expect(bookingDoc.data()?.status).toBe('pending_payment');
  });
});
