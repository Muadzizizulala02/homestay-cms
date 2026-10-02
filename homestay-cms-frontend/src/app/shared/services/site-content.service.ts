import { Injectable, computed, inject, signal } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';
import { localizeSettings, type LocalizedSettings } from '../i18n/localize';
import { SiteSettingsService, type SiteSettings } from './site-settings.service';

/**
 * Loads the public site settings once for the whole visit and exposes them in the visitor's
 * language. Pages inject this instead of each calling the API themselves.
 */
@Injectable({ providedIn: 'root' })
export class SiteContentService {
  private readonly api = inject(SiteSettingsService);
  private readonly i18n = inject(I18nService);

  private readonly raw = signal<SiteSettings | null>(null);
  private requested = false;

  /** The untranslated settings, for fields that are not language-specific (geo, social links, SEO). */
  readonly settings = this.raw.asReadonly();
  /** Settings in the active language; null until loaded. */
  readonly content = computed<LocalizedSettings | null>(() => {
    const settings = this.raw();
    return settings ? localizeSettings(settings, this.i18n.lang()) : null;
  });

  /** Fetches on first call only; safe to call from every page. */
  ensureLoaded(): void {
    if (this.requested) {
      return;
    }
    this.requested = true;
    this.api.getPublic().subscribe({
      next: (settings) => this.raw.set(settings),
      error: () => {
        this.requested = false; // allow a retry on the next page that asks
      },
    });
  }
}
