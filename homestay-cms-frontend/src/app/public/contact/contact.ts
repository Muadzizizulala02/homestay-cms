import { Component, OnInit, inject } from '@angular/core';
import { SeoService } from '../../core/seo.service';
import { I18nService } from '../../shared/i18n/i18n.service';
import { SiteContentService } from '../../shared/services/site-content.service';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class ContactPage implements OnInit {
  private readonly siteContent = inject(SiteContentService);
  private readonly seo = inject(SeoService);
  protected readonly i18n = inject(I18nService);

  readonly content = this.siteContent.content;
  readonly settings = this.siteContent.settings;

  ngOnInit(): void {
    this.seo.setPage(this.i18n.t('nav.contact'), this.i18n.t('contact.seoDescription'));
    this.siteContent.ensureLoaded();
  }

  whatsappLink(phone: string): string {
    return `https://wa.me/${phone.replace(/[^\d]/g, '')}`;
  }
}
