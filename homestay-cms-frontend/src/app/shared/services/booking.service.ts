import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GuestDetails {
  name: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface PriceLine {
  label: string;
  amount: number;
}

export interface PriceBreakdown {
  nights: number;
  lines: PriceLine[];
  total: number;
  currency: string;
}

export interface Booking {
  id: string;
  reference: string;
  accommodationId: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  guest: GuestDetails;
  price: PriceBreakdown;
  status: string;
  paymentStatus: string;
}

export interface CreateBookingInput {
  accommodationId: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  guest: GuestDetails;
}

export type AvailabilityMap = Record<string, 'booked' | 'blocked'>;

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getAvailability(accommodationId: string, from: string, to: string): Observable<AvailabilityMap> {
    return this.http.get<AvailabilityMap>(`${this.baseUrl}/accommodations/${accommodationId}/availability`, {
      params: { from, to },
    });
  }

  create(input: CreateBookingInput): Observable<Booking> {
    return this.http.post<Booking>(`${this.baseUrl}/bookings`, input);
  }

  lookup(reference: string, email: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.baseUrl}/bookings/lookup`, { params: { reference, email } });
  }

  /** May fail if ToyyibPay isn't configured yet — callers should fall back gracefully, not error out. */
  createPayment(bookingId: string): Observable<{ redirectUrl: string }> {
    return this.http.post<{ redirectUrl: string }>(`${this.baseUrl}/bookings/${bookingId}/payment`, {});
  }
}
