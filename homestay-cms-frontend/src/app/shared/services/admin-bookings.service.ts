import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Booking } from './booking.service';

export interface AdminBooking extends Booking {
  /** True when a gateway payment is paid — such bookings are refunded, not cancelled. */
  paidOnline: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminBookingsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/bookings`;

  list(): Observable<AdminBooking[]> {
    return this.http.get<AdminBooking[]>(this.baseUrl);
  }

  /** Payment was received outside the gateway (bank transfer, cash). */
  confirm(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/${id}/confirm`, {});
  }

  cancel(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/${id}/cancel`, {});
  }

  /** Records a refund already processed through ToyyibPay; cancels the booking. */
  refund(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/${id}/refund`, {});
  }
}
