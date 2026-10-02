import { describe, expect, it } from 'vitest';
import type { SiteSettings } from '../services/site-settings.service';
import { clampInterval, heroSlides, localizeFacility, localizeNotice, localizeSettings, pick, sectionBackgrounds } from './localize';

function settings(overrides: Partial<SiteSettings> = {}): SiteSettings {
  return {
    heroHeadline: 'Welcome',
    heroSubheadline: 'A quiet stay',
    heroImageUrl: '',
    heroImages: [],
    heroIntervalSeconds: 5,
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
    privacyPolicy: '',
    termsAndConditions: '',
    notices: [],
    facilities: [],
    translations: { ms: {} },
    sectionBackgrounds: {},
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

describe('heroSlides', () => {
  it('uses the slideshow when there is one', () => {
    expect(heroSlides({ heroImages: ['a', 'b'], heroImageUrl: 'single' })).toEqual(['a', 'b']);
  });

  it('falls back to the single hero image, then to nothing', () => {
    expect(heroSlides({ heroImages: [], heroImageUrl: 'single' })).toEqual(['single']);
    expect(heroSlides({ heroImages: [], heroImageUrl: '' })).toEqual([]);
  });

  it('copes with a settings document that has no slideshow field at all', () => {
    expect(heroSlides({ heroImageUrl: 'single' } as never)).toEqual(['single']);
  });

  it('ignores blank entries', () => {
    expect(heroSlides({ heroImages: ['', 'a'], heroImageUrl: '' })).toEqual(['a']);
  });
});

describe('clampInterval', () => {
  it('defaults to 5 when missing or not a number', () => {
    expect(clampInterval(undefined)).toBe(5);
    expect(clampInterval(Number.NaN)).toBe(5);
  });

  it('keeps sensible values and pulls extremes back into 2-30', () => {
    expect(clampInterval(8)).toBe(8);
    expect(clampInterval(0)).toBe(2);
    expect(clampInterval(500)).toBe(30);
  });
});

describe('localizeSettings policies and slides', () => {
  it('shows Malay policies when present and English otherwise', () => {
    const base = settings({ privacyPolicy: 'Privacy', termsAndConditions: 'Terms', translations: { ms: { privacyPolicy: 'Privasi' } } });
    const ms = localizeSettings(base, 'ms');
    expect(ms.privacyPolicy).toBe('Privasi');
    expect(ms.termsAndConditions).toBe('Terms');
  });

  it('exposes the slides and a clamped interval', () => {
    const result = localizeSettings(settings({ heroImages: ['a', 'b'], heroIntervalSeconds: 99 }), 'en');
    expect(result.heroSlides).toEqual(['a', 'b']);
    expect(result.heroIntervalSeconds).toBe(30);
  });
});

describe('sectionBackgrounds', () => {
  it('gives every section an entry, empty meaning the default design', () => {
    expect(sectionBackgrounds({ sectionBackgrounds: {} })).toEqual({ facilities: '', steps: '', rules: '', about: '' });
  });

  it('passes set photos through, trimmed, and leaves the others empty', () => {
    expect(sectionBackgrounds({ sectionBackgrounds: { steps: ' https://a/1.jpg ', about: 'https://a/2.jpg' } })).toEqual({
      facilities: '',
      steps: 'https://a/1.jpg',
      rules: '',
      about: 'https://a/2.jpg',
    });
  });

  it('copes with a settings document that predates the field', () => {
    expect(sectionBackgrounds({} as never)).toEqual({ facilities: '', steps: '', rules: '', about: '' });
  });

  it('is exposed through localizeSettings', () => {
    const result = localizeSettings(settings({ sectionBackgrounds: { facilities: 'https://a/f.jpg' } }), 'en');
    expect(result.sectionBackgrounds.facilities).toBe('https://a/f.jpg');
    expect(result.sectionBackgrounds.steps).toBe('');
  });
});
