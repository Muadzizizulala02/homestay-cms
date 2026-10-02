import type { Accommodation } from '../services/accommodation.service';
import type { Facility, FaqItem, Notice, SectionKey, SiteSettings, SocialLink } from '../services/site-settings.service';
import type { Lang } from './i18n.service';

/** The site content a visitor sees in their language. Every field has an English fallback. */
export interface LocalizedSettings {
  heroHeadline: string;
  heroSubheadline: string;
  heroImageUrl: string;
  /** The slideshow to show: `heroImages`, else the single `heroImageUrl`, else empty. */
  heroSlides: string[];
  heroIntervalSeconds: number;
  aboutContent: string;
  hostIntro: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  privacyPolicy: string;
  termsAndConditions: string;
  socialLinks: SocialLink[];
  /** Photo behind each home section; '' means the section's default design. */
  sectionBackgrounds: Record<SectionKey, string>;
  houseRules: string[];
  faqs: FaqItem[];
  notices: LocalizedNotice[];
  facilities: LocalizedFacility[];
}

export interface LocalizedNotice {
  id: string;
  title: string;
  body: string;
  important: boolean;
}

export interface LocalizedFacility {
  icon: string;
  label: string;
  description: string;
}

/** Malay text if it is non-blank, otherwise the English original. */
export function pick(lang: Lang, english: string, malay: string | undefined): string {
  return lang === 'ms' && malay && malay.trim() ? malay : english;
}

function pickList<T>(lang: Lang, english: T[], malay: T[] | undefined): T[] {
  return lang === 'ms' && malay && malay.length > 0 ? malay : english;
}

/** The images the hero should cycle through: the slideshow if set, else the single hero image. */
export function heroSlides(settings: Pick<SiteSettings, 'heroImages' | 'heroImageUrl'>): string[] {
  const slides = (settings.heroImages ?? []).filter((url) => !!url);
  if (slides.length > 0) {
    return slides;
  }
  return settings.heroImageUrl ? [settings.heroImageUrl] : [];
}

export const DEFAULT_HERO_INTERVAL_SECONDS = 5;

/** Documents saved before the slideshow existed have no interval; out-of-range values are pulled back in. */
export function clampInterval(seconds: number | undefined): number {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) {
    return DEFAULT_HERO_INTERVAL_SECONDS;
  }
  return Math.min(30, Math.max(2, Math.round(seconds)));
}

const SECTION_KEYS: readonly SectionKey[] = ['facilities', 'steps', 'rules', 'about'];

/** Every section always has an entry; missing or non-string values become '' (the default design). */
export function sectionBackgrounds(settings: Pick<SiteSettings, 'sectionBackgrounds'>): Record<SectionKey, string> {
  const raw = settings.sectionBackgrounds ?? {};
  const result = {} as Record<SectionKey, string>;
  for (const key of SECTION_KEYS) {
    const value = raw[key];
    result[key] = typeof value === 'string' ? value.trim() : '';
  }
  return result;
}

export function localizeNotice(notice: Notice, lang: Lang): LocalizedNotice {
  return {
    id: notice.id,
    title: pick(lang, notice.title, notice.titleMs),
    body: pick(lang, notice.body, notice.bodyMs),
    important: notice.important,
  };
}

export function localizeFacility(facility: Facility, lang: Lang): LocalizedFacility {
  return {
    icon: facility.icon,
    label: pick(lang, facility.label, facility.labelMs),
    description: pick(lang, facility.description, facility.descriptionMs),
  };
}

export function localizeSettings(settings: SiteSettings, lang: Lang): LocalizedSettings {
  // Settings saved before these fields existed come back without them; never assume present.
  const ms = settings.translations?.ms ?? {};
  return {
    heroHeadline: pick(lang, settings.heroHeadline, ms.heroHeadline),
    heroSubheadline: pick(lang, settings.heroSubheadline, ms.heroSubheadline),
    heroImageUrl: settings.heroImageUrl,
    heroSlides: heroSlides(settings),
    heroIntervalSeconds: clampInterval(settings.heroIntervalSeconds),
    aboutContent: pick(lang, settings.aboutContent, ms.aboutContent),
    hostIntro: pick(lang, settings.hostIntro, ms.hostIntro),
    address: settings.address,
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    checkInTime: settings.checkInTime,
    checkOutTime: settings.checkOutTime,
    cancellationPolicy: pick(lang, settings.cancellationPolicy, ms.cancellationPolicy),
    privacyPolicy: pick(lang, settings.privacyPolicy ?? '', ms.privacyPolicy),
    termsAndConditions: pick(lang, settings.termsAndConditions ?? '', ms.termsAndConditions),
    socialLinks: settings.socialLinks ?? [],
    sectionBackgrounds: sectionBackgrounds(settings),
    houseRules: pickList(lang, settings.houseRules ?? [], ms.houseRules),
    faqs: pickList(lang, settings.faqs ?? [], ms.faqs),
    notices: (settings.notices ?? []).filter((n) => n.active).map((n) => localizeNotice(n, lang)),
    facilities: (settings.facilities ?? []).map((f) => localizeFacility(f, lang)),
  };
}

/** A room's description in the visitor's language (name, price and amenities are shared). */
export function localizeDescription(unit: Accommodation, lang: Lang): string {
  return pick(lang, unit.description, unit.descriptionMs);
}
