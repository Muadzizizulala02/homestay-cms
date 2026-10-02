import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../config/firebase';
import type { SiteSettings } from '../types/site-settings.types';

const DOC_PATH = 'siteSettings/main';

const DEFAULT_SITE_SETTINGS: Omit<SiteSettings, 'updatedAt'> = {
  heroHeadline: 'Welcome to Our Homestay',
  heroSubheadline: 'A comfortable, quiet place to stay — edit this from the admin dashboard.',
  heroImageUrl: '',
  aboutContent: 'Tell your guests about your homestay here.',
  hostIntro: '',
  address: '',
  geo: { lat: 0, lng: 0 },
  contactEmail: '',
  contactPhone: '',
  socialLinks: [],
  checkInTime: '14:00',
  checkOutTime: '12:00',
  houseRules: [],
  faqs: [],
  cancellationPolicy: '',
  seoDefaults: { title: 'Homestay', description: '', shareImageUrl: '' },
};

/** Returns sensible defaults if the singleton hasn't been created/edited yet — never 404s. */
export async function getSiteSettings(): Promise<SiteSettings> {
  const doc = await db.doc(DOC_PATH).get();
  if (!doc.exists) {
    return { ...DEFAULT_SITE_SETTINGS, updatedAt: Timestamp.now() };
  }
  return doc.data() as SiteSettings;
}

export type UpdateSiteSettingsInput = Partial<Omit<SiteSettings, 'updatedAt'>>;

export async function updateSiteSettings(input: UpdateSiteSettingsInput): Promise<SiteSettings> {
  const existing = await getSiteSettings();
  const merged: SiteSettings = { ...existing, ...input, updatedAt: Timestamp.now() };
  await db.doc(DOC_PATH).set(merged);
  return merged;
}
