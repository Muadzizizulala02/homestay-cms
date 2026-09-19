import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';
import { AccommodationService, type Accommodation } from '../../shared/services/accommodation.service';
import { SiteSettingsService, type SiteSettings } from '../../shared/services/site-settings.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private readonly siteSettingsService = inject(SiteSettingsService);
  private readonly accommodationService = inject(AccommodationService);
  private readonly seo = inject(SeoService);

  readonly settings = signal<SiteSettings | null>(null);
  readonly featured = signal<Accommodation[]>([]);

  ngOnInit(): void {
    this.siteSettingsService.getPublic().subscribe((settings) => {
      this.settings.set(settings);
      this.seo.setPage(settings.heroHeadline, settings.heroSubheadline || settings.seoDefaults.description);
    });

    this.accommodationService.listPublic().subscribe((list) => this.featured.set(list.slice(0, 3)));
  }
}
