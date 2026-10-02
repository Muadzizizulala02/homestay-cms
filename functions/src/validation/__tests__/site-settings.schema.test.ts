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

  it('accepts a hero slideshow, its interval, policies and Malay policies', () => {
    const parsed = updateSiteSettingsSchema.safeParse({
      heroImages: ['https://res.cloudinary.com/demo/a.jpg', 'https://res.cloudinary.com/demo/b.jpg'],
      heroIntervalSeconds: 5,
      privacyPolicy: 'We use your details only to handle your booking.',
      termsAndConditions: 'By booking you agree to these terms.',
      translations: { ms: { privacyPolicy: 'Kami guna maklumat anda untuk tempahan.', termsAndConditions: 'Dengan menempah anda bersetuju.' } },
    });
    expect(parsed.success).toBe(true);
  });

  it('keeps the new fields instead of stripping them', () => {
    const parsed = updateSiteSettingsSchema.parse({ heroImages: ['https://a.example/1.jpg'], heroIntervalSeconds: 8, privacyPolicy: 'x' });
    expect(parsed.heroImages).toEqual(['https://a.example/1.jpg']);
    expect(parsed.heroIntervalSeconds).toBe(8);
    expect(parsed.privacyPolicy).toBe('x');
  });

  it('limits the slideshow length and the interval to sensible values', () => {
    const many = Array.from({ length: 11 }, (_, i) => `https://a.example/${i}.jpg`);
    expect(updateSiteSettingsSchema.safeParse({ heroImages: many }).success).toBe(false);
    expect(updateSiteSettingsSchema.safeParse({ heroIntervalSeconds: 1 }).success).toBe(false);
    expect(updateSiteSettingsSchema.safeParse({ heroIntervalSeconds: 31 }).success).toBe(false);
    expect(updateSiteSettingsSchema.safeParse({ heroIntervalSeconds: 2.5 }).success).toBe(false);
    expect(updateSiteSettingsSchema.safeParse({ heroIntervalSeconds: 2 }).success).toBe(true);
    expect(updateSiteSettingsSchema.safeParse({ heroIntervalSeconds: 30 }).success).toBe(true);
  });

  it('only allows http(s) slideshow images', () => {
    expect(updateSiteSettingsSchema.safeParse({ heroImages: ['javascript:alert(1)'] }).success).toBe(false);
    expect(updateSiteSettingsSchema.safeParse({ heroImages: ['data:image/png;base64,AAAA'] }).success).toBe(false);
  });
});
