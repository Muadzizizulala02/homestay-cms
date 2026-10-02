import { Injectable, signal } from '@angular/core';
import { DICTIONARY } from './translations';

export type Lang = 'en' | 'ms';

const STORAGE_KEY = 'homestay.lang';

function readStoredLang(): Lang | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'en' || stored === 'ms' ? stored : null;
  } catch {
    return null; // storage can be blocked (private mode, strict settings)
  }
}

function detectLang(): Lang {
  const stored = readStoredLang();
  if (stored) {
    return stored;
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('ms') ? 'ms' : 'en';
}

/**
 * UI-label translation (English / Bahasa Malaysia) plus the active-language signal. Content
 * written in the admin is translated separately, in the content itself (see localize.ts).
 * `t()` reads the language signal, so templates calling it update when the language changes.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly langSignal = signal<Lang>(detectLang());
  readonly lang = this.langSignal.asReadonly();

  constructor() {
    this.applyToDocument(this.langSignal());
  }

  setLang(lang: Lang): void {
    this.langSignal.set(lang);
    this.applyToDocument(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Not persisted; the choice still applies for this visit.
    }
  }

  toggle(): void {
    this.setLang(this.langSignal() === 'en' ? 'ms' : 'en');
  }

  /** Looks up a label. Falls back to English, then to the key itself so a gap is visible, not blank. */
  t(key: string, params?: Record<string, string | number>): string {
    const lang = this.langSignal();
    const text = DICTIONARY[lang][key] ?? DICTIONARY['en'][key] ?? key;
    return params ? text.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`)) : text;
  }

  private applyToDocument(lang: Lang): void {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }
}
