import type { Routes } from '@angular/router';
import { adminGuard } from './shared/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'admin/login',
    loadComponent: () => import('./admin/login/login').then((m) => m.Login),
  },
  {
    path: 'admin/dashboard',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'admin/accommodation',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/accommodation/accommodation').then((m) => m.AccommodationPage),
  },
  {
    path: 'admin/media',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/media/media').then((m) => m.MediaPage),
  },
  // TODO(Phase 5): replace with the real public homepage once it exists.
  { path: '', redirectTo: 'admin/login', pathMatch: 'full' },
];
