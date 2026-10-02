import { Component, OnInit, inject } from '@angular/core';
import { SeoService } from '../../core/seo.service';
import { I18nService } from '../../shared/i18n/i18n.service';
import { SiteContentService } from '../../shared/services/site-content.service';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.html',
  styleUrl: './faq.scss',
})
export class FaqPage implements OnInit {
  private readonly siteContent = inject(SiteContentService);
  private readonly seo = inject(SeoService);
  protected readonly i18n = inject(I18nService);

  readonly content = this.siteContent.content;

  ngOnInit(): void {
    this.seo.setPage(this.i18n.t('nav.faq'), this.i18n.t('faq.seoDescription'));
    this.siteContent.ensureLoaded();
  }
}
