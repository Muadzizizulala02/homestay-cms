import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SeoService } from '../../core/seo.service';
import { I18nService } from '../../shared/i18n/i18n.service';
import { localizeDescription } from '../../shared/i18n/localize';
import { AccommodationService, type Accommodation } from '../../shared/services/accommodation.service';
import { SiteContentService } from '../../shared/services/site-content.service';
import { BookingBar } from '../../shared/ui/booking-bar/booking-bar';
import { cssUrl } from '../../shared/ui/css-url';
import { HeroSlideshow } from '../../shared/ui/hero-slideshow/hero-slideshow';
import { Reveal } from '../../shared/ui/reveal/reveal';
import { injectHeroTyping } from '../../shared/ui/hero-typing/hero-typing';
import { HomeAbout } from './sections/home-about/home-about';
import { HomeFacilities } from './sections/home-facilities/home-facilities';
import { HomeSteps } from './sections/home-steps/home-steps';
import { rulesToItems } from '../../shared/ui/policy-showcase/policy-parse';
import { PolicyShowcase } from '../../shared/ui/policy-showcase/policy-showcase';
import { ImgFade } from '../../shared/ui/img-fade/img-fade';
import { Skeleton } from '../../shared/ui/skeleton/skeleton';

const ROOMS_ON_HOME = 3;

@Component({
  selector: 'app-home',
  imports: [RouterLink, MatIconModule, BookingBar, HeroSlideshow, Skeleton, Reveal, ImgFade, PolicyShowcase, HomeFacilities, HomeSteps, HomeAbout],
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
  /** The headline and intro line type themselves in a loop (static for reduced motion). */
  readonly typing = injectHeroTyping(
    computed(() => this.content()?.heroHeadline ?? ''),
    computed(() => this.content()?.heroSubheadline ?? '')
  );
  /** House rules as icon cards, with the check-in/out times as the section's closing line. */
  readonly ruleItems = computed(() => rulesToItems(this.content()?.houseRules ?? []));
  readonly heroBackground = computed(() => this.content()?.heroSlides?.[0] ?? '');
  /** Photo behind each home section, set in the admin; '' keeps that section's default design. */
  readonly backgrounds = computed(
    () => this.content()?.sectionBackgrounds ?? { rooms: '', facilities: '', steps: '', rules: '', about: '' }
  );
  /** House rules always have a photo: the owner's choice, else the first hero photo (the long-standing default). */
  readonly rulesBackground = computed(() => this.backgrounds().rules || this.heroBackground());
  /** The About section's framed photo: the second hero photo (so it differs from the one behind the hero), else the first. */
  readonly aboutPhoto = computed(() => this.content()?.heroSlides?.[1] ?? this.content()?.heroSlides?.[0] ?? '');
  readonly checkTimes = computed(() => {
    const c = this.content();
    return c?.checkInTime && c?.checkOutTime ? this.i18n.t('home.rules.checkTimes', { in: c.checkInTime, out: c.checkOutTime }) : '';
  });
  readonly featured = signal<Accommodation[]>([]);
  /** False until the rooms request finishes (success or error), so we show a skeleton, not nothing. */
  readonly roomsLoaded = signal(false);
  /**
   * Photo behind the booking bar and rooms, set in the admin. Shown while the rooms load and when
   * there are rooms; with no rooms section there is nothing for it to sit behind.
   */
  readonly roomsImage = computed(() =>
    !this.roomsLoaded() || this.featured().length > 0 ? cssUrl(this.backgrounds().rooms) : null
  );
  readonly skeletonRooms = [0, 1, 2];
  readonly skeletonFacilities = [0, 1, 2];

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
