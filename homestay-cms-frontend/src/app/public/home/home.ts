import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SeoService } from '../../core/seo.service';
import { I18nService } from '../../shared/i18n/i18n.service';
import { localizeDescription } from '../../shared/i18n/localize';
import { AccommodationService, type Accommodation } from '../../shared/services/accommodation.service';
import { SiteContentService } from '../../shared/services/site-content.service';
import { BookingBar } from '../../shared/ui/booking-bar/booking-bar';

const ROOMS_ON_HOME = 3;

@Component({
  selector: 'app-home',
  imports: [RouterLink, MatIconModule, BookingBar],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  protected readonly i18n = inject(I18nService);
  private readonly siteContent = inject(SiteContentService);
  private readonly accommodationService = inject(AccommodationService);
  private readonly seo = inject(SeoService);

  readonly content = this.siteContent.content;
  readonly featured = signal<Accommodation[]>([]);
  readonly stepNumbers = [1, 2, 3, 4];

  constructor() {
    // Page title/description follow the visitor's language once the settings have loaded.
    effect(() => {
      const content = this.content();
      const settings = this.siteContent.settings();
      if (content && settings) {
        this.seo.setPage(content.heroHeadline, content.heroSubheadline || settings.seoDefaults.description);
      }
    });
  }

  ngOnInit(): void {
    this.siteContent.ensureLoaded();
    this.accommodationService.listPublic().subscribe((list) => this.featured.set(list.slice(0, ROOMS_ON_HOME)));
  }

  description(unit: Accommodation): string {
    return localizeDescription(unit, this.i18n.lang());
  }
}
