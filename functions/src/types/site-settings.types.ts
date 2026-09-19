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
  seoDefaults: {
    title: string;
    description: string;
    shareImageUrl: string;
  };
  updatedAt: Timestamp;
}
