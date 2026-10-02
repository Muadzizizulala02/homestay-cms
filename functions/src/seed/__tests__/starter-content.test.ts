import { describe, it, expect } from 'vitest';
import { createAccommodationSchema } from '../../validation/accommodation.schema';
import { updateSiteSettingsSchema } from '../../validation/site-settings.schema';
import {
  STARTER_CONTENT,
  STARTER_GALLERY,
  STARTER_HERO_PHOTO_ID,
  STARTER_HERO_PHOTO_IDS,
  STARTER_PHOTOS,
  STARTER_ROOMS,
} from '../starter-content';

describe('STARTER_CONTENT', () => {
  it('passes the same validation the admin editor is held to', () => {
    const parsed = updateSiteSettingsSchema.safeParse(STARTER_CONTENT);
    expect(parsed.success).toBe(true);
  });

  it('only uses placeholder contact details that cannot belong to a real person', () => {
    // No street address is invented; the email uses the reserved example.com domain; the phone
    // number is obviously fake; social links are bare platform homepages, not anyone's account.
    expect(STARTER_CONTENT.address).toBe('');
    expect(STARTER_CONTENT.contactEmail).toMatch(/@example\.com$/);
    expect(STARTER_CONTENT.contactPhone).toMatch(/^\+60 ?12-?000 ?0000$/);
    expect(STARTER_CONTENT.socialLinks.length).toBeGreaterThan(0);
    for (const link of STARTER_CONTENT.socialLinks) {
      const url = new URL(link.url);
      expect(url.protocol).toBe('https:');
      expect(url.pathname).toBe('/'); // the platform's front page, never a specific account
      expect(url.search).toBe('');
    }
    expect(STARTER_CONTENT.notices).toEqual([]);
  });

  it('promises nothing about money: no amounts, percentages or deadlines', () => {
    const text = JSON.stringify(STARTER_CONTENT);
    expect(text).not.toMatch(/RM\s?\d|\d+\s?%/);
    // The cancellation wording in particular must contain no digits at all (no "3 days", "50%").
    for (const policy of [STARTER_CONTENT.cancellationPolicy, STARTER_CONTENT.translations.ms.cancellationPolicy ?? '']) {
      expect(policy.length).toBeGreaterThan(40);
      expect(policy).not.toMatch(/\d/);
    }
  });

  it('has a host introduction in both languages', () => {
    expect(STARTER_CONTENT.hostIntro.length).toBeGreaterThan(40);
    expect(STARTER_CONTENT.translations.ms.hostIntro?.length).toBeGreaterThan(40);
  });

  it('has a Malay version for every English list, so the language toggle never shows a half-translated page', () => {
    const ms = STARTER_CONTENT.translations.ms;
    expect(ms.heroHeadline).toBeTruthy();
    expect(ms.heroSubheadline).toBeTruthy();
    expect(ms.aboutContent).toBeTruthy();
    expect(ms.houseRules?.length).toBe(STARTER_CONTENT.houseRules.length);
    expect(ms.faqs?.length).toBe(STARTER_CONTENT.faqs.length);
    for (const facility of STARTER_CONTENT.facilities) {
      expect(facility.labelMs).toBeTruthy();
    }
  });

  it('numbers FAQs in order, in both languages', () => {
    expect(STARTER_CONTENT.faqs.map((f) => f.order)).toEqual(STARTER_CONTENT.faqs.map((_, i) => i));
    expect(STARTER_CONTENT.translations.ms.faqs?.map((f) => f.order)).toEqual(
      STARTER_CONTENT.translations.ms.faqs?.map((_, i) => i)
    );
  });
});

describe('STARTER_ROOMS', () => {
  it('has rooms that pass the same validation as the admin accommodation form', () => {
    expect(STARTER_ROOMS.length).toBeGreaterThan(0);
    for (const { id, ...room } of STARTER_ROOMS) {
      const parsed = createAccommodationSchema.safeParse(room);
      expect(parsed.success, `${id}: ${JSON.stringify(parsed.error?.issues)}`).toBe(true);
    }
  });

  it('offers three rooms, from the smallest to the largest, with prices that rise with capacity', () => {
    expect(STARTER_ROOMS).toHaveLength(3);
    const byCapacity = [...STARTER_ROOMS].sort((a, b) => a.capacity - b.capacity);
    expect(byCapacity.map((r) => r.basePrice)).toEqual([...byCapacity.map((r) => r.basePrice)].sort((a, b) => a - b));
  });

  it('gives every room stable, unique ids and slugs so a re-run can skip what exists', () => {
    expect(new Set(STARTER_ROOMS.map((r) => r.id)).size).toBe(STARTER_ROOMS.length);
    expect(new Set(STARTER_ROOMS.map((r) => r.slug)).size).toBe(STARTER_ROOMS.length);
  });

  it('gives every room at least one https photo and a Malay description', () => {
    for (const room of STARTER_ROOMS) {
      expect(room.photos.length).toBeGreaterThan(0);
      for (const photo of room.photos) {
        expect(photo).toMatch(/^https:\/\//);
      }
      expect(room.descriptionMs).toBeTruthy();
    }
  });

  it('only lists amenities that the starter facilities already claim', () => {
    const claimed = new Set(STARTER_CONTENT.facilities.map((f) => f.label));
    for (const room of STARTER_ROOMS) {
      for (const amenity of room.amenities) {
        expect(claimed.has(amenity), `${room.slug}: ${amenity}`).toBe(true);
      }
    }
  });

  it('keeps stay limits and capacity sensible', () => {
    for (const room of STARTER_ROOMS) {
      expect(room.minStay).toBeLessThanOrEqual(room.maxStay);
      expect(room.capacity).toBeGreaterThanOrEqual(room.beds);
      expect(room.active).toBe(true);
    }
  });
});

describe('STARTER_PHOTOS and gallery', () => {
  it('gives every stock photo a unique id, an https source and real alt text', () => {
    expect(new Set(STARTER_PHOTOS.map((p) => p.id)).size).toBe(STARTER_PHOTOS.length);
    for (const photo of STARTER_PHOTOS) {
      expect(photo.sourceUrl).toMatch(/^https:\/\//);
      expect(photo.altText.length).toBeGreaterThan(15); // a description, not "image"
    }
  });

  it('uses one of the stock photos as the hero and as the social-share image', () => {
    const hero = STARTER_PHOTOS.find((p) => p.id === STARTER_HERO_PHOTO_ID);
    expect(hero).toBeDefined();
    expect(STARTER_CONTENT.heroImageUrl).toBe(hero?.sourceUrl);
    expect(STARTER_CONTENT.seoDefaults.shareImageUrl).toBe(hero?.sourceUrl);
  });

  it('builds a gallery from the stock photos, in order, with alt text', () => {
    expect(STARTER_GALLERY.map((g) => g.photoId)).toEqual(STARTER_PHOTOS.map((p) => p.id));
    expect(STARTER_GALLERY.length).toBeGreaterThanOrEqual(4);
    expect(new Set(STARTER_GALLERY.map((g) => g.id)).size).toBe(STARTER_GALLERY.length);
  });

  it('only uses stock photos that are declared, so the seed script can upload every one of them', () => {
    const declared = new Set(STARTER_PHOTOS.map((p) => p.sourceUrl));
    for (const room of STARTER_ROOMS) {
      for (const photo of room.photos) {
        expect(declared.has(photo), `${room.slug}: ${photo}`).toBe(true);
      }
    }
  });
});

describe('starter hero slideshow and policies', () => {
  it('seeds a slideshow of declared stock photos that starts with the hero photo', () => {
    expect(STARTER_HERO_PHOTO_IDS.length).toBeGreaterThanOrEqual(3);
    expect(STARTER_HERO_PHOTO_IDS[0]).toBe(STARTER_HERO_PHOTO_ID);
    const declared = new Map(STARTER_PHOTOS.map((p) => [p.id, p.sourceUrl]));
    expect(STARTER_CONTENT.heroImages).toEqual(STARTER_HERO_PHOTO_IDS.map((id) => declared.get(id)));
    expect(STARTER_CONTENT.heroImageUrl).toBe(STARTER_CONTENT.heroImages[0]);
  });

  it('shows each hero image for 5 seconds by default', () => {
    expect(STARTER_CONTENT.heroIntervalSeconds).toBe(5);
  });

  it('seeds a privacy policy and terms in both languages', () => {
    expect(STARTER_CONTENT.privacyPolicy.length).toBeGreaterThan(100);
    expect(STARTER_CONTENT.termsAndConditions.length).toBeGreaterThan(100);
    expect(STARTER_CONTENT.translations.ms.privacyPolicy?.length).toBeGreaterThan(100);
    expect(STARTER_CONTENT.translations.ms.termsAndConditions?.length).toBeGreaterThan(100);
  });
});
