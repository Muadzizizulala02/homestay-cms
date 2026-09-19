import { v2 as cloudinary } from 'cloudinary';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../config/firebase';
import { env } from '../config/env';
import { AppError } from '../utils/app-error';
import type { MediaAssociation, MediaItem } from '../types/media.types';

const COLLECTION = 'media';

function configureCloudinary(): void {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
  });
}

export interface SignedUploadParams {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}

/**
 * Lets the browser upload directly to Cloudinary without the API secret ever reaching it.
 * File type/size/dimension limits are enforced as Cloudinary upload preset restrictions
 * (configured in the Cloudinary dashboard), not re-implemented here.
 */
export function createSignedUploadParams(folder = 'homestay'): SignedUploadParams {
  configureCloudinary();
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, env.cloudinaryApiSecret);

  return { timestamp, signature, apiKey: env.cloudinaryApiKey, cloudName: env.cloudinaryCloudName, folder };
}

export interface RecordMediaInput {
  cloudinaryPublicId: string;
  url: string;
  altText: string;
  association: MediaAssociation;
}

/** Called by the admin client after a signed upload to Cloudinary succeeds. */
export async function recordMediaItem(input: RecordMediaInput): Promise<MediaItem> {
  const countSnap = await db.collection(COLLECTION).count().get();
  const ref = db.collection(COLLECTION).doc();
  const item: MediaItem = {
    id: ref.id,
    cloudinaryPublicId: input.cloudinaryPublicId,
    url: input.url,
    altText: input.altText,
    association: input.association,
    order: countSnap.data().count,
    createdAt: Timestamp.now(),
  };
  await ref.set(item);
  return item;
}

export async function listMedia(): Promise<MediaItem[]> {
  const snap = await db.collection(COLLECTION).orderBy('order').get();
  return snap.docs.map((doc) => doc.data() as MediaItem);
}

export interface UpdateMediaInput {
  altText?: string;
  order?: number;
  association?: MediaAssociation;
}

export async function updateMediaItem(id: string, input: UpdateMediaInput): Promise<MediaItem> {
  const ref = db.collection(COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists) {
    throw new AppError(404, 'Media item not found', 'MEDIA_NOT_FOUND');
  }
  const updated: MediaItem = { ...(doc.data() as MediaItem), ...input };
  await ref.set(updated);
  return updated;
}

/** Removes the asset from Cloudinary as well as its Firestore record — never just the reference. */
export async function deleteMediaItem(id: string): Promise<void> {
  const ref = db.collection(COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists) {
    throw new AppError(404, 'Media item not found', 'MEDIA_NOT_FOUND');
  }

  const { cloudinaryPublicId } = doc.data() as MediaItem;
  configureCloudinary();
  await cloudinary.uploader.destroy(cloudinaryPublicId);
  await ref.delete();
}
