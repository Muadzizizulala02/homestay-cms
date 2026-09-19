import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WeekdayRate {
  daysOfWeek: number[];
  nightlyRate: number;
}

export interface SeasonalRate {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  nightlyRate: number;
}

export interface Accommodation {
  id: string;
  slug: string;
  name: string;
  description: string;
  photos: string[];
  capacity: number;
  beds: number;
  amenities: string[];
  basePrice: number;
  weekdayRates?: WeekdayRate[];
  seasonalRates?: SeasonalRate[];
  minStay: number;
  maxStay: number;
  active: boolean;
}

export type AccommodationInput = Omit<Accommodation, 'id'>;

@Injectable({ providedIn: 'root' })
export class AccommodationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/accommodations`;
  private readonly publicUrl = `${environment.apiUrl}/accommodations`;

  /** Public — active units only, no auth required. Used by the guest-facing site. */
  listPublic(): Observable<Accommodation[]> {
    return this.http.get<Accommodation[]>(this.publicUrl);
  }

  getPublicBySlug(slug: string): Observable<Accommodation> {
    return this.http.get<Accommodation>(`${this.publicUrl}/${slug}`);
  }

  /** Admin — all units, including inactive. */
  list(): Observable<Accommodation[]> {
    return this.http.get<Accommodation[]>(this.baseUrl);
  }

  create(input: AccommodationInput): Observable<Accommodation> {
    return this.http.post<Accommodation>(this.baseUrl, input);
  }

  update(id: string, input: Partial<AccommodationInput>): Observable<Accommodation> {
    return this.http.put<Accommodation>(`${this.baseUrl}/${id}`, input);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
