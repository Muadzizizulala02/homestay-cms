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
    path: 'admin/content',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/content/content').then((m) => m.ContentPage),
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
  {
    path: '',
    loadComponent: () => import('./public/public-layout/public-layout').then((m) => m.PublicLayout),
    children: [
      { path: '', loadComponent: () => import('./public/home/home').then((m) => m.Home) },
      {
        path: 'accommodation',
        loadComponent: () =>
          import('./public/accommodation-list/accommodation-list').then((m) => m.AccommodationListPage),
      },
      {
        path: 'accommodation/:slug',
        loadComponent: () =>
          import('./public/accommodation-detail/accommodation-detail').then((m) => m.AccommodationDetailPage),
      },
      { path: 'gallery', loadComponent: () => import('./public/gallery/gallery').then((m) => m.GalleryPage) },
      { path: 'about', loadComponent: () => import('./public/about/about').then((m) => m.AboutPage) },
      { path: 'faq', loadComponent: () => import('./public/faq/faq').then((m) => m.FaqPage) },
      { path: 'contact', loadComponent: () => import('./public/contact/contact').then((m) => m.ContactPage) },
      { path: 'booking', loadComponent: () => import('./public/booking/booking').then((m) => m.BookingPage) },
      { path: '**', loadComponent: () => import('./public/not-found/not-found').then((m) => m.NotFoundPage) },
    ],
  },
];
