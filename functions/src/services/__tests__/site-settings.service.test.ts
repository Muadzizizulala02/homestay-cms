import { describe, it, expect } from 'vitest';
import { getSiteSettings, updateSiteSettings } from '../site-settings.service';

describe('site-settings.service', () => {
  it('returns sensible defaults before anything has been saved', async () => {
    // Note: shares the singleton doc with other tests in this file, so this only checks shape.
    const settings = await getSiteSettings();
    expect(settings.checkInTime).toBeTruthy();
    expect(settings.checkOutTime).toBeTruthy();
    expect(Array.isArray(settings.faqs)).toBe(true);
    expect(Array.isArray(settings.houseRules)).toBe(true);
  });

  it('merges a partial update into the existing settings without dropping other fields', async () => {
    const before = await updateSiteSettings({ heroHeadline: 'Test Homestay', checkInTime: '15:00' });
    expect(before.heroHeadline).toBe('Test Homestay');
    expect(before.checkOutTime).toBeTruthy(); // untouched field survived

    const after = await updateSiteSettings({ contactEmail: 'owner@example.com' });
    expect(after.contactEmail).toBe('owner@example.com');
    expect(after.heroHeadline).toBe('Test Homestay'); // still there from the previous update
    expect(after.checkInTime).toBe('15:00');
  });

  it('replaces array fields wholesale rather than merging element-by-element', async () => {
    await updateSiteSettings({ houseRules: ['No smoking', 'No pets'] });
    const updated = await updateSiteSettings({ houseRules: ['No parties'] });
    expect(updated.houseRules).toEqual(['No parties']);
  });
});
