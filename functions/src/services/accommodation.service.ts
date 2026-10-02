import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../config/firebase';
import { AppError } from '../utils/app-error';
import type { Accommodation } from '../types/accommodation.types';

const COLLECTION = 'accommodations';

export type CreateAccommodationInput = Omit<Accommodation, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateAccommodationInput = Partial<CreateAccommodationInput>;

function assertValidStayRange(minStay: number, maxStay: number): void {
  if (minStay > maxStay) {
    throw new AppError(400, 'minStay must be less than or equal to maxStay', 'INVALID_STAY_RANGE');
  }
}

async function assertSlugAvailable(slug: string, excludingId?: string): Promise<void> {
  const snap = await db.collection(COLLECTION).where('slug', '==', slug).limit(1).get();
  const taken = snap.docs.some((doc) => doc.id !== excludingId);
  if (taken) {
    throw new AppError(409, `An accommodation with slug "${slug}" already exists`, 'SLUG_TAKEN');
  }
}

export async function listAccommodations(): Promise<Accommodation[]> {
  const snap = await db.collection(COLLECTION).orderBy('name').get();
  return snap.docs.map((doc) => doc.data() as Accommodation);
}

/** Public listing — active units only, for the guest-facing website. */
export async function listActiveAccommodations(): Promise<Accommodation[]> {
  const snap = await db.collection(COLLECTION).where('active', '==', true).orderBy('name').get();
  return snap.docs.map((doc) => doc.data() as Accommodation);
}

/** Public detail lookup by slug — 404s for an unknown OR inactive slug (same as not found to a guest). */
export async function getActiveAccommodationBySlug(slug: string): Promise<Accommodation> {
  const snap = await db
    .collection(COLLECTION)
    .where('slug', '==', slug)
    .where('active', '==', true)
    .limit(1)
    .get();
  if (snap.empty) {
    throw new AppError(404, 'Accommodation not found', 'ACCOMMODATION_NOT_FOUND');
  }
  return snap.docs[0].data() as Accommodation;
}

export async function getAccommodation(id: string): Promise<Accommodation> {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) {
    throw new AppError(404, 'Accommodation not found', 'ACCOMMODATION_NOT_FOUND');
  }
  return doc.data() as Accommodation;
}

export async function createAccommodation(input: CreateAccommodationInput): Promise<Accommodation> {
  assertValidStayRange(input.minStay, input.maxStay);
  await assertSlugAvailable(input.slug);

  const ref = db.collection(COLLECTION).doc();
  const now = Timestamp.now();
  const accommodation: Accommodation = { id: ref.id, ...input, createdAt: now, updatedAt: now };
  await ref.set(accommodation);
  return accommodation;
}

export async function updateAccommodation(
  id: string,
  input: UpdateAccommodationInput
): Promise<Accommodation> {
  const existing = await getAccommodation(id);
  const merged: Accommodation = { ...existing, ...input, id, updatedAt: Timestamp.now() };
  assertValidStayRange(merged.minStay, merged.maxStay);

  if (input.slug && input.slug !== existing.slug) {
    await assertSlugAvailable(input.slug, id);
  }

  await db.collection(COLLECTION).doc(id).set(merged);
  return merged;
}

export async function deleteAccommodation(id: string): Promise<void> {
  await getAccommodation(id); // throws 404 if missing

  const bookingsSnap = await db.collection('bookings').where('accommodationId', '==', id).limit(1).get();
  if (!bookingsSnap.empty) {
    throw new AppError(
      409,
      'Cannot delete an accommodation with existing bookings — deactivate it instead',
      'ACCOMMODATION_HAS_BOOKINGS'
    );
  }

  await db.collection(COLLECTION).doc(id).delete();
}
