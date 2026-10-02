import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FaqItem {
  question: string;
  answer: string;
  order: number;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  titleMs?: string;
  bodyMs?: string;
  important: boolean;
  active: boolean;
}

export interface Facility {
  /** A Material icon name, e.g. "wifi". */
  icon: string;
  label: string;
  description: string;
  labelMs?: string;
  descriptionMs?: string;
}

/** Bahasa Malaysia versions of the free-text content; any empty field falls back to English. */
export interface MalayContent {
  heroHeadline?: string;
  heroSubheadline?: string;
  aboutContent?: string;
  hostIntro?: string;
  cancellationPolicy?: string;
  privacyPolicy?: string;
  termsAndConditions?: string;
  houseRules?: string[];
  faqs?: FaqItem[];
}

export interface SiteSettings {
  heroHeadline: string;
  heroSubheadline: string;
  heroImageUrl: string;
  /** Hero slideshow in display order. Empty = use `heroImageUrl`, then a plain background. */
  heroImages: string[];
  /** Seconds each hero image is shown (2-30). */
  heroIntervalSeconds: number;
  aboutContent: string;
  hostIntro: string;
  address: string;
  geo: { lat: number; lng: number };
  contactEmail: string;
  contactPhone: string;
  socialLinks: SocialLink[];
  checkInTime: string;
  checkOutTime: string;
  houseRules: string[];
  faqs: FaqItem[];
  cancellationPolicy: string;
  privacyPolicy: string;
  termsAndConditions: string;
  notices: Notice[];
  facilities: Facility[];
  translations: { ms: MalayContent };
  seoDefaults: { title: string; description: string; shareImageUrl: string };
}

export type UpdateSiteSettingsInput = Partial<SiteSettings>;

@Injectable({ providedIn: 'root' })
export class SiteSettingsService {
  private readonly http = inject(HttpClient);

  /** Public read — no auth, used by the guest-facing site. */
  getPublic(): Observable<SiteSettings> {
    return this.http.get<SiteSettings>(`${environment.apiUrl}/site-settings`);
  }

  /** Admin read/write — requires the auth interceptor's token. */
  getForAdmin(): Observable<SiteSettings> {
    return this.http.get<SiteSettings>(`${environment.apiUrl}/admin/site-settings`);
  }

  update(input: UpdateSiteSettingsInput): Observable<SiteSettings> {
    return this.http.put<SiteSettings>(`${environment.apiUrl}/admin/site-settings`, input);
  }
}
