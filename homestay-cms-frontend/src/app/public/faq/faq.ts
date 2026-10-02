import { Skeleton } from '../../shared/ui/skeleton/skeleton';
import { Component, OnInit, effect, inject } from '@angular/core';
import { SeoService } from '../../core/seo.service';
import { I18nService } from '../../shared/i18n/i18n.service';
import { SiteContentService } from '../../shared/services/site-content.service';
import { LoadError } from '../../shared/ui/load-error/load-error';

@Component({
  selector: 'app-faq',
  imports: [LoadError, Skeleton],
  templateUrl: './faq.html',
  styleUrl: './faq.scss',
})
export class FaqPage implements OnInit {
  private readonly siteContent = inject(SiteContentService);
  private readonly seo = inject(SeoService);
  protected readonly i18n = inject(I18nService);

  protected readonly bars = [0, 1, 2, 3, 4];
  readonly content = this.siteContent.content;
  readonly failed = this.siteContent.failed;

  constructor() {
    effect(() => {
      this.seo.setPage(this.i18n.t('nav.faq'), this.i18n.t('faq.seoDescription'));
    });
  }

  retry(): void {
    this.siteContent.ensureLoaded();
  }

  ngOnInit(): void {
    this.siteContent.ensureLoaded();
  }
}
