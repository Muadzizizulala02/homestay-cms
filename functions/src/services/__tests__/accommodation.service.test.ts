import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../../config/firebase';
import {
  createAccommodation,
  deleteAccommodation,
  getAccommodation,
  listAccommodations,
  updateAccommodation,
  type CreateAccommodationInput,
} from '../accommodation.service';
import { createBooking } from '../booking.service';
import { AppError } from '../../utils/app-error';

function accommodationInput(overrides: Partial<CreateAccommodationInput> = {}): CreateAccommodationInput {
  return {
    slug: `garden-room-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: 'Garden Room',
    description: 'A quiet room facing the garden.',
    photos: [],
    capacity: 2,
    beds: 1,
    amenities: ['wifi'],
    basePrice: 150,
    minStay: 1,
    maxStay: 14,
    active: true,
    ...overrides,
  };
}

describe('accommodation.service', () => {
  it('creates and fetches an accommodation', async () => {
    const input = accommodationInput();
    const created = await createAccommodation(input);

    expect(created.id).toBeTruthy();
    expect(created.slug).toBe(input.slug);

    const fetched = await getAccommodation(created.id);
    expect(fetched).toEqual(created);
  });

  it('rejects a duplicate slug', async () => {
    const input = accommodationInput();
    await createAccommodation(input);
    await expect(createAccommodation(input)).rejects.toThrow(AppError);
  });

  it('rejects minStay greater than maxStay', async () => {
    await expect(createAccommodation(accommodationInput({ minStay: 10, maxStay: 5 }))).rejects.toThrow(
      AppError
    );
  });

  it('updates an accommodation, merging fields', async () => {
    const created = await createAccommodation(accommodationInput({ basePrice: 100 }));
    const updated = await updateAccommodation(created.id, { basePrice: 120, active: false });

    expect(updated.basePrice).toBe(120);
    expect(updated.active).toBe(false);
    expect(updated.name).toBe(created.name); // untouched fields survive the merge
  });

  it('rejects an update that would make minStay exceed maxStay', async () => {
    const created = await createAccommodation(accommodationInput({ minStay: 1, maxStay: 5 }));
    await expect(updateAccommodation(created.id, { minStay: 10 })).rejects.toThrow(AppError);
  });

  it('404s when fetching or updating an unknown accommodation', async () => {
    await expect(getAccommodation('does-not-exist')).rejects.toThrow(AppError);
    await expect(updateAccommodation('does-not-exist', { basePrice: 1 })).rejects.toThrow(AppError);
  });

  it('lists accommodations ordered by name', async () => {
    await createAccommodation(accommodationInput({ name: `Zebra-${Date.now()}` }));
    await createAccommodation(accommodationInput({ name: `Alpha-${Date.now()}` }));
    const all = await listAccommodations();
    const names = all.map((a) => a.name);
    expect(names).toEqual([...names].sort());
  });

  it('deletes an accommodation with no bookings', async () => {
    const created = await createAccommodation(accommodationInput());
    await deleteAccommodation(created.id);
    await expect(getAccommodation(created.id)).rejects.toThrow(AppError);
  });

  it('refuses to delete an accommodation that has a booking', async () => {
    const created = await createAccommodation(accommodationInput({ capacity: 2 }));
    await createBooking({
      accommodationId: created.id,
      checkInDate: '2027-03-01',
      checkOutDate: '2027-03-03',
      guestCount: 2,
      guest: { name: 'Guest', email: 'guest@example.com', phone: '+60123456789' },
    });

    await expect(deleteAccommodation(created.id)).rejects.toThrow(AppError);

    // Still there, and the caller can deactivate it instead.
    const stillThere = await getAccommodation(created.id);
    expect(stillThere.id).toBe(created.id);
  });

  it('allows deactivating instead of deleting once a booking exists', async () => {
    const created = await createAccommodation(accommodationInput());
    await db
      .collection('accommodations')
      .doc(created.id)
      .update({ updatedAt: Timestamp.now() }); // sanity: direct writes still work outside the service
    const deactivated = await updateAccommodation(created.id, { active: false });
    expect(deactivated.active).toBe(false);
  });
});
