import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

/**
 * Minimal SEO plumbing: per-page title/description. Sitemap, robots.txt, canonical tags,
 * Open Graph, and structured data are planned for the dedicated SEO/performance phase
 * (see docs/SEO.md) — this only covers what each public page needs today.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  setPage(title: string, description: string): void {
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
  }

  setNoIndex(): void {
    this.meta.updateTag({ name: 'robots', content: 'noindex' });
  }
}
