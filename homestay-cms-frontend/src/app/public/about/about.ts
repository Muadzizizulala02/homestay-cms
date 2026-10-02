import { Component, OnInit, computed, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { SeoService } from '../../core/seo.service';
import { I18nService } from '../../shared/i18n/i18n.service';
import { SiteContentService } from '../../shared/services/site-content.service';

@Component({
  selector: 'app-about',
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class AboutPage implements OnInit {
  private readonly siteContent = inject(SiteContentService);
  private readonly seo = inject(SeoService);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly i18n = inject(I18nService);

  readonly content = this.siteContent.content;
  readonly mapUrl = computed(() => {
    const address = this.content()?.address;
    if (!address) {
      return null;
    }
    // Key-free embed: no Google Maps API key required for this basic query embed.
    const url = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  ngOnInit(): void {
    this.seo.setPage(this.i18n.t('nav.about'), this.i18n.t('about.seoDescription'));
    this.siteContent.ensureLoaded();
  }
}
