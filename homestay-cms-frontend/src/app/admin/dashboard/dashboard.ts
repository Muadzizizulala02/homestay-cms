import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ApiService } from '../../shared/services/api.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [MatButtonModule, MatCardModule, MatToolbarModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);

  readonly email = this.authService.user()?.email ?? null;
  readonly backendCheck = signal<'pending' | 'ok' | 'error'>('pending');

  ngOnInit(): void {
    this.apiService.getAdminProfile().subscribe({
      next: () => this.backendCheck.set('ok'),
      error: () => this.backendCheck.set('error'),
    });
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigateByUrl('/admin/login');
  }
}
