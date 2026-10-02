import { describe, it, expect } from 'vitest';
import { createAccommodationSchema } from '../../validation/accommodation.schema';
import { updateSiteSettingsSchema } from '../../validation/site-settings.schema';
import { STARTER_CONTENT, STARTER_ROOMS } from '../starter-content';

describe('STARTER_CONTENT', () => {
  it('passes the same validation the admin editor is held to', () => {
    const parsed = updateSiteSettingsSchema.safeParse(STARTER_CONTENT);
    expect(parsed.success).toBe(true);
  });

  it('does not invent facts about the business', () => {
    // These are the owner's to enter; a public site must never show made-up ones.
    expect(STARTER_CONTENT.address).toBe('');
    expect(STARTER_CONTENT.contactEmail).toBe('');
    expect(STARTER_CONTENT.contactPhone).toBe('');
    expect(STARTER_CONTENT.socialLinks).toEqual([]);
    expect(STARTER_CONTENT.heroImageUrl).toBe('');
    expect(STARTER_CONTENT.cancellationPolicy).toBe('');
    expect(STARTER_CONTENT.notices).toEqual([]);
    expect(JSON.stringify(STARTER_CONTENT)).not.toMatch(/RM\s?\d|\d+\s?%|refund/i);
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
