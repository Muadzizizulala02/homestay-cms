import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminProfile {
  uid: string;
  email: string | null;
}

/** Thin wrapper around HttpClient for the backend REST API under environment.apiUrl. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getAdminProfile(): Observable<AdminProfile> {
    return this.http.get<AdminProfile>(`${this.baseUrl}/admin/me`);
  }
}
