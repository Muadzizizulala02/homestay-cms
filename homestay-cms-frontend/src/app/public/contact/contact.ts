import { Component, OnInit, inject, signal } from '@angular/core';
import { SeoService } from '../../core/seo.service';
import { SiteSettingsService, type SiteSettings } from '../../shared/services/site-settings.service';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class ContactPage implements OnInit {
  private readonly siteSettingsService = inject(SiteSettingsService);
  private readonly seo = inject(SeoService);

  readonly settings = signal<SiteSettings | null>(null);

  ngOnInit(): void {
    this.seo.setPage('Contact', 'Get in touch — phone, email, address, and social links.');
    this.siteSettingsService.getPublic().subscribe((settings) => this.settings.set(settings));
  }

  whatsappLink(phone: string): string {
    return `https://wa.me/${phone.replace(/[^\d]/g, '')}`;
  }
}
