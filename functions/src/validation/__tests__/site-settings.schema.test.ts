import { describe, it, expect } from 'vitest';
import { updateSiteSettingsSchema } from '../site-settings.schema';

describe('updateSiteSettingsSchema', () => {
  it('accepts notices, facilities and a Malay overlay', () => {
    const parsed = updateSiteSettingsSchema.safeParse({
      notices: [{ id: 'a', title: 'Closed', body: 'Back soon', important: false, active: true }],
      facilities: [{ icon: 'pool', label: 'Pool', description: '' }],
      translations: { ms: { heroHeadline: 'Selamat Datang', faqs: [{ question: 'Q', answer: 'A', order: 0 }] } },
    });
    expect(parsed.success).toBe(true);
  });

  it('keeps the new fields instead of silently stripping them', () => {
    const parsed = updateSiteSettingsSchema.parse({
      facilities: [{ icon: 'wifi', label: 'Wi-Fi', description: '', labelMs: 'Wi-Fi' }],
    });
    expect(parsed.facilities?.[0].labelMs).toBe('Wi-Fi');
  });

  it('rejects a notice with no title', () => {
    const parsed = updateSiteSettingsSchema.safeParse({
      notices: [{ id: 'a', title: '', body: 'x', important: false, active: true }],
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects an icon name that is not a plain identifier', () => {
    const parsed = updateSiteSettingsSchema.safeParse({
      facilities: [{ icon: '<script>', label: 'X', description: '' }],
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects non-http(s) schemes for social links and the hero image', () => {
    expect(
      updateSiteSettingsSchema.safeParse({ socialLinks: [{ platform: 'X', url: 'javascript:alert(1)' }] }).success
    ).toBe(false);
    expect(updateSiteSettingsSchema.safeParse({ heroImageUrl: 'data:text/html,hi' }).success).toBe(false);
  });

  it('still accepts https links, and an empty hero image', () => {
    expect(
      updateSiteSettingsSchema.safeParse({
        socialLinks: [{ platform: 'Instagram', url: 'https://instagram.com/stay' }],
        heroImageUrl: '',
      }).success
    ).toBe(true);
  });
});
