import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SeoService } from '../../core/seo.service';
import { I18nService } from '../../shared/i18n/i18n.service';
import { localizeDescription } from '../../shared/i18n/localize';
import { AccommodationService, type Accommodation } from '../../shared/services/accommodation.service';
import { SiteContentService } from '../../shared/services/site-content.service';
import { BookingBar } from '../../shared/ui/booking-bar/booking-bar';
import { HeroSlideshow } from '../../shared/ui/hero-slideshow/hero-slideshow';
import { Reveal } from '../../shared/ui/reveal/reveal';
import { Skeleton } from '../../shared/ui/skeleton/skeleton';

const ROOMS_ON_HOME = 3;

@Component({
  selector: 'app-home',
  imports: [RouterLink, MatIconModule, BookingBar, HeroSlideshow, Skeleton, Reveal],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  protected readonly i18n = inject(I18nService);
  private readonly siteContent = inject(SiteContentService);
  private readonly accommodationService = inject(AccommodationService);
  private readonly seo = inject(SeoService);

  readonly content = this.siteContent.content;
  readonly failed = this.siteContent.failed;
  /** The headline split into words so each can rise in one after another. */
  readonly headlineWords = computed(() => (this.content()?.heroHeadline ?? '').split(/\s+/).filter(Boolean));
  readonly featured = signal<Accommodation[]>([]);
  /** False until the rooms request finishes (success or error), so we show a skeleton, not nothing. */
  readonly roomsLoaded = signal(false);
  readonly skeletonRooms = [0, 1, 2];
  readonly skeletonFacilities = [0, 1, 2];
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
    this.accommodationService.listPublic().subscribe({
      next: (list) => {
        this.featured.set(list.slice(0, ROOMS_ON_HOME));
        this.roomsLoaded.set(true);
      },
      error: () => this.roomsLoaded.set(true),
    });
  }

  description(unit: Accommodation): string {
    return localizeDescription(unit, this.i18n.lang());
  }
}
