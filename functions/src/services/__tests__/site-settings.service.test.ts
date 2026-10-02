import { describe, it, expect } from 'vitest';
import { db } from '../../config/firebase';
import { getPublicSiteSettings, getSiteSettings, updateSiteSettings } from '../site-settings.service';

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

  it('fills in new content fields for a settings document saved before they existed', async () => {
    // A document in the shape the app wrote before notices/facilities/translations were added.
    await db.doc('siteSettings/main').set({
      heroHeadline: 'Legacy Homestay',
      heroSubheadline: '',
      heroImageUrl: '',
      aboutContent: '',
      hostIntro: '',
      address: '',
      geo: { lat: 0, lng: 0 },
      contactEmail: '',
      contactPhone: '',
      socialLinks: [],
      checkInTime: '14:00',
      checkOutTime: '12:00',
      houseRules: [],
      faqs: [],
      cancellationPolicy: '',
      seoDefaults: { title: '', description: '', shareImageUrl: '' },
    });

    const settings = await getSiteSettings();

    expect(settings.heroHeadline).toBe('Legacy Homestay');
    expect(settings.notices).toEqual([]);
    expect(settings.facilities).toEqual([]);
    expect(settings.translations).toEqual({ ms: {} });
  });

  it('stores notices, facilities and the Malay translation overlay', async () => {
    const updated = await updateSiteSettings({
      notices: [{ id: 'n1', title: 'Pool closed', body: 'Repairs until Friday.', important: true, active: true }],
      facilities: [{ icon: 'wifi', label: 'Wi-Fi', description: 'Fast fibre', labelMs: 'Wi-Fi', descriptionMs: 'Gentian pantas' }],
      translations: { ms: { heroHeadline: 'Selamat Datang', houseRules: ['Dilarang merokok'] } },
    });

    expect(updated.notices[0].title).toBe('Pool closed');
    expect(updated.facilities[0].labelMs).toBe('Wi-Fi');
    expect(updated.translations.ms.heroHeadline).toBe('Selamat Datang');

    const reread = await getSiteSettings();
    expect(reread.translations.ms.houseRules).toEqual(['Dilarang merokok']);
  });

  it('serves only active notices on the public read, while the admin read keeps drafts', async () => {
    await updateSiteSettings({
      notices: [
        { id: 'live', title: 'Live', body: '', important: false, active: true },
        { id: 'draft', title: 'Draft', body: '', important: true, active: false },
      ],
    });

    const publicView = await getPublicSiteSettings();
    const adminView = await getSiteSettings();

    expect(publicView.notices.map((n) => n.id)).toEqual(['live']);
    expect(adminView.notices.map((n) => n.id)).toEqual(['live', 'draft']);
  });

  it('defaults the hero slideshow (empty, 5 seconds) and policies for a document that predates them', async () => {
    await db.doc('siteSettings/main').set({
      heroHeadline: 'Older Homestay',
      heroSubheadline: '',
      heroImageUrl: 'https://a.example/hero.jpg',
      aboutContent: '',
      hostIntro: '',
      address: '',
      geo: { lat: 0, lng: 0 },
      contactEmail: '',
      contactPhone: '',
      socialLinks: [],
      checkInTime: '14:00',
      checkOutTime: '12:00',
      houseRules: [],
      faqs: [],
      cancellationPolicy: '',
      seoDefaults: { title: '', description: '', shareImageUrl: '' },
    });

    const settings = await getSiteSettings();

    expect(settings.heroImages).toEqual([]);
    expect(settings.heroIntervalSeconds).toBe(5);
    expect(settings.privacyPolicy).toBe('');
    expect(settings.termsAndConditions).toBe('');
    expect(settings.heroImageUrl).toBe('https://a.example/hero.jpg'); // existing value untouched
  });

  it('stores a slideshow, its interval and the policies, and returns them publicly', async () => {
    await updateSiteSettings({
      heroImages: ['https://a.example/1.jpg', 'https://a.example/2.jpg'],
      heroIntervalSeconds: 7,
      privacyPolicy: 'Privacy text',
      termsAndConditions: 'Terms text',
      translations: { ms: { privacyPolicy: 'Teks privasi' } },
    });

    const publicView = await getPublicSiteSettings();

    expect(publicView.heroImages).toHaveLength(2);
    expect(publicView.heroIntervalSeconds).toBe(7);
    expect(publicView.privacyPolicy).toBe('Privacy text');
    expect(publicView.translations.ms.privacyPolicy).toBe('Teks privasi');
  });
});
