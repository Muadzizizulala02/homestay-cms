import type { Accommodation } from '../services/accommodation.service';
import type { Facility, FaqItem, Notice, SiteSettings } from '../services/site-settings.service';
import type { Lang } from './i18n.service';

/** The site content a visitor sees in their language. Every field has an English fallback. */
export interface LocalizedSettings {
  heroHeadline: string;
  heroSubheadline: string;
  heroImageUrl: string;
  aboutContent: string;
  hostIntro: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
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
    aboutContent: pick(lang, settings.aboutContent, ms.aboutContent),
    hostIntro: pick(lang, settings.hostIntro, ms.hostIntro),
    address: settings.address,
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    checkInTime: settings.checkInTime,
    checkOutTime: settings.checkOutTime,
    cancellationPolicy: pick(lang, settings.cancellationPolicy, ms.cancellationPolicy),
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
