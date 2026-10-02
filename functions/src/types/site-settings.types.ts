import type { Timestamp } from 'firebase-admin/firestore';

export interface FaqItem {
  question: string;
  answer: string;
  order: number;
}

export interface SocialLink {
  platform: string;
  url: string;
}

/** A short announcement. `important` ones also open as a popup on a visitor's first page view. */
export interface Notice {
  id: string;
  title: string;
  body: string;
  titleMs?: string;
  bodyMs?: string;
  important: boolean;
  active: boolean;
}

/** One amenity. `icon` is a Material Symbols/Icons name, e.g. "wifi". */
export interface Facility {
  icon: string;
  label: string;
  description: string;
  labelMs?: string;
  descriptionMs?: string;
}

/**
 * Bahasa Malaysia versions of the free-text content. Each list is a complete, independent
 * Malay list (not index-matched to the English one, which would desync on any reorder); any
 * field left empty falls back to the English text on the public site.
 */
export interface MalayContent {
  heroHeadline?: string;
  heroSubheadline?: string;
  aboutContent?: string;
  hostIntro?: string;
  cancellationPolicy?: string;
  houseRules?: string[];
  faqs?: FaqItem[];
}

/** Singleton document at siteSettings/main. */
export interface SiteSettings {
  heroHeadline: string;
  heroSubheadline: string;
  heroImageUrl: string;
  aboutContent: string;
  hostIntro: string;
  address: string;
  geo: { lat: number; lng: number };
  contactEmail: string;
  contactPhone: string;
  socialLinks: SocialLink[];
  checkInTime: string;
  checkOutTime: string;
  houseRules: string[];
  faqs: FaqItem[];
  cancellationPolicy: string;
  notices: Notice[];
  facilities: Facility[];
  translations: { ms: MalayContent };
  seoDefaults: {
    title: string;
    description: string;
    shareImageUrl: string;
  };
  updatedAt: Timestamp;
}
