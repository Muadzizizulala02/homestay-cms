import { Component, OnInit, inject, signal } from '@angular/core';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { SeoService } from '../../core/seo.service';
import { SiteSettingsService, type SiteSettings } from '../../shared/services/site-settings.service';

@Component({
  selector: 'app-about',
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class AboutPage implements OnInit {
  private readonly siteSettingsService = inject(SiteSettingsService);
  private readonly seo = inject(SeoService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly settings = signal<SiteSettings | null>(null);
  readonly mapUrl = signal<SafeResourceUrl | null>(null);

  ngOnInit(): void {
    this.seo.setPage('About', 'The story behind the homestay, our host, and our location.');
    this.siteSettingsService.getPublic().subscribe((settings) => {
      this.settings.set(settings);
      if (settings.address) {
        // Key-free embed — no Google Maps API key required for this basic query embed.
        const url = `https://www.google.com/maps?q=${encodeURIComponent(settings.address)}&output=embed`;
        this.mapUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
      }
    });
  }
}
