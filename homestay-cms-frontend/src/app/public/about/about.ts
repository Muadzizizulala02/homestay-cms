import { Skeleton } from '../../shared/ui/skeleton/skeleton';
import { Component, OnInit, computed, effect, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { SeoService } from '../../core/seo.service';
import { I18nService } from '../../shared/i18n/i18n.service';
import { SiteContentService } from '../../shared/services/site-content.service';
import { LoadError } from '../../shared/ui/load-error/load-error';

@Component({
  selector: 'app-about',
  imports: [LoadError, Skeleton],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class AboutPage implements OnInit {
  private readonly siteContent = inject(SiteContentService);
  private readonly seo = inject(SeoService);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly i18n = inject(I18nService);

  readonly content = this.siteContent.content;
  readonly failed = this.siteContent.failed;
  readonly mapUrl = computed(() => {
    const address = this.content()?.address;
    if (!address) {
      return null;
    }
    // Key-free embed: no Google Maps API key required for this basic query embed.
    const url = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  constructor() {
    effect(() => {
      this.seo.setPage(this.i18n.t('nav.about'), this.i18n.t('about.seoDescription'));
    });
  }

  retry(): void {
    this.siteContent.ensureLoaded();
  }

  ngOnInit(): void {
    this.siteContent.ensureLoaded();
  }
}
