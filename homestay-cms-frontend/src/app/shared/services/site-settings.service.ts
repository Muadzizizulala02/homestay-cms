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

export interface SiteSettings {
  heroHeadline: string;
  heroSubheadline: string;
  heroImageUrl: string;
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
