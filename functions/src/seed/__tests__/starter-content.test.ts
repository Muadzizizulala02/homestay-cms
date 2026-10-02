import { describe, it, expect } from 'vitest';
import { updateSiteSettingsSchema } from '../../validation/site-settings.schema';
import { STARTER_CONTENT } from '../starter-content';

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
