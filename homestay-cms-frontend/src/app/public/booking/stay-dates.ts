import type { Lang } from '../../shared/i18n/i18n.service';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

function parse(iso: string): Date | null {
  if (!ISO_DATE.test(iso)) {
    return null;
  }
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** True for a well-formed YYYY-MM-DD date string. */
export function isIsoDate(value: string | null | undefined): value is string {
  return !!value && parse(value) !== null;
}

/** Whole nights between two ISO dates; 0 when either is missing/invalid or the range is not forward. */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = parse(checkIn);
  const b = parse(checkOut);
  if (!a || !b) {
    return 0;
  }
  const days = Math.round((b.getTime() - a.getTime()) / DAY_MS);
  return days > 0 ? days : 0;
}

/** "12 Nov" / "12 Nov 2026" in the visitor's language. Returns the input if it is not a valid date. */
export function formatStayDate(iso: string, lang: Lang, withYear = false): string {
  const date = parse(iso);
  if (!date) {
    return iso;
  }
  return new Intl.DateTimeFormat(lang === 'ms' ? 'ms-MY' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
    timeZone: 'UTC',
  }).format(date);
}
