import { Component, OnInit, inject, signal } from '@angular/core';
import { SeoService } from '../../core/seo.service';
import { SiteSettingsService, type SiteSettings } from '../../shared/services/site-settings.service';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.html',
  styleUrl: './faq.scss',
})
export class FaqPage implements OnInit {
  private readonly siteSettingsService = inject(SiteSettingsService);
  private readonly seo = inject(SeoService);

  readonly settings = signal<SiteSettings | null>(null);

  ngOnInit(): void {
    this.seo.setPage('FAQ & House Rules', 'Check-in/out times, house rules, and frequently asked questions.');
    this.siteSettingsService.getPublic().subscribe((settings) => this.settings.set(settings));
  }
}
