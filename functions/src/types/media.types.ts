import type { Timestamp } from 'firebase-admin/firestore';

export type MediaAssociation =
  | { type: 'gallery' }
  | { type: 'accommodation'; accommodationId: string };

export interface MediaItem {
  id: string;
  cloudinaryPublicId: string;
  url: string;
  /** Required, not optional — every image must have real alt text. */
  altText: string;
  association: MediaAssociation;
  order: number;
  createdAt: Timestamp;
}
