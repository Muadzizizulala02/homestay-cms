import { describe, expect, it } from 'vitest';
import type { SiteSettings } from '../services/site-settings.service';
import { localizeFacility, localizeNotice, localizeSettings, pick } from './localize';

function settings(overrides: Partial<SiteSettings> = {}): SiteSettings {
  return {
    heroHeadline: 'Welcome',
    heroSubheadline: 'A quiet stay',
    heroImageUrl: '',
    aboutContent: 'About us',
    hostIntro: '',
    address: '1 Jalan Satu',
    geo: { lat: 0, lng: 0 },
    contactEmail: '',
    contactPhone: '',
    socialLinks: [],
    checkInTime: '14:00',
    checkOutTime: '12:00',
    houseRules: ['No smoking'],
    faqs: [{ question: 'Parking?', answer: 'Yes', order: 0 }],
    cancellationPolicy: 'Free until 7 days before',
    notices: [],
    facilities: [],
    translations: { ms: {} },
    seoDefaults: { title: '', description: '', shareImageUrl: '' },
    ...overrides,
  };
}

describe('pick', () => {
  it('returns English in English mode even when Malay exists', () => {
    expect(pick('en', 'Hello', 'Helo')).toBe('Hello');
  });

  it('returns Malay in Malay mode when it is filled in', () => {
    expect(pick('ms', 'Hello', 'Selamat datang')).toBe('Selamat datang');
  });

  it('falls back to English when the Malay text is missing or blank', () => {
    expect(pick('ms', 'Hello', undefined)).toBe('Hello');
    expect(pick('ms', 'Hello', '   ')).toBe('Hello');
  });
});

describe('localizeSettings', () => {
  it('uses Malay text where provided and English everywhere else', () => {
    const result = localizeSettings(settings({ translations: { ms: { heroHeadline: 'Selamat Datang' } } }), 'ms');

    expect(result.heroHeadline).toBe('Selamat Datang');
    expect(result.heroSubheadline).toBe('A quiet stay'); // no Malay yet -> English
    expect(result.address).toBe('1 Jalan Satu'); // not translatable
  });

  it('only replaces a list when the Malay list is non-empty', () => {
    expect(localizeSettings(settings({ translations: { ms: { houseRules: [] } } }), 'ms').houseRules).toEqual([
      'No smoking',
    ]);
    expect(
      localizeSettings(settings({ translations: { ms: { houseRules: ['Dilarang merokok'] } } }), 'ms').houseRules
    ).toEqual(['Dilarang merokok']);
  });

  it('copes with a settings document saved before translations, notices and facilities existed', () => {
    const legacy = settings();
    const stripped = { ...legacy } as Partial<SiteSettings>;
    delete stripped.translations;
    delete stripped.notices;
    delete stripped.facilities;

    const result = localizeSettings(stripped as SiteSettings, 'ms');

    expect(result.heroHeadline).toBe('Welcome');
    expect(result.notices).toEqual([]);
    expect(result.facilities).toEqual([]);
  });

  it('hides notices the admin switched off', () => {
    const result = localizeSettings(
      settings({
        notices: [
          { id: 'a', title: 'Shown', body: '', important: false, active: true },
          { id: 'b', title: 'Hidden', body: '', important: false, active: false },
        ],
      }),
      'en'
    );

    expect(result.notices.map((n) => n.id)).toEqual(['a']);
  });
});

describe('localizeNotice and localizeFacility', () => {
  it('translate title/body and label/description with English fallback', () => {
    const notice = { id: 'n', title: 'Pool closed', body: 'Repairs', titleMs: 'Kolam ditutup', important: true, active: true };
    expect(localizeNotice(notice, 'ms')).toMatchObject({ title: 'Kolam ditutup', body: 'Repairs', important: true });

    const facility = { icon: 'wifi', label: 'Wi-Fi', description: 'Fast', descriptionMs: 'Laju' };
    expect(localizeFacility(facility, 'ms')).toEqual({ icon: 'wifi', label: 'Wi-Fi', description: 'Laju' });
  });
});
