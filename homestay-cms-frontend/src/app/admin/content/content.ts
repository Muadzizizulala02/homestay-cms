import { HttpErrorResponse } from '@angular/common/http';
import { NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Skeleton } from '../../shared/ui/skeleton/skeleton';
import { MediaService, type MediaItem } from '../../shared/services/media.service';
import {
  SiteSettingsService,
  type MalayContent,
  type SiteSettings,
} from '../../shared/services/site-settings.service';
import {
  MAX_SLIDES,
  MAX_SOCIAL_LINKS,
  OTHER_ICON,
  OTHER_PLATFORM,
  SOCIAL_PLATFORMS,
  SUGGESTED_ICONS,
  addSlide,
  createFacilityGroup,
  createFaqGroup,
  createNoticeGroup,
  createRuleControl,
  createSocialLinkGroup,
  createTranslatableGroup,
  initialSlides,
  isHttpUrlOrEmpty,
  moveSlide,
  nextShareImage,
  removeSlide,
  toFacilities,
  toMalayContent,
  toNotices,
  toSocialLinks,
  type FacilityGroup,
  type NoticeGroup,
  type SocialLinkGroup,
  type TranslatableGroup,
} from './content-form';

type Language = 'en' | 'ms';

const MIN_INTERVAL = 2;
const MAX_INTERVAL = 30;
const DEFAULT_INTERVAL = 5;

function wholeSeconds(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  return typeof value === 'number' && Number.isInteger(value) ? null : { whole: true };
}

@Component({
  selector: 'app-admin-content',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatToolbarModule,
    Skeleton,
  ],
  templateUrl: './content.html',
  styleUrl: './content.scss',
})
export class ContentPage implements OnInit {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly siteSettingsService = inject(SiteSettingsService);
  private readonly mediaService = inject(MediaService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loaded = signal(false);
  readonly loadFailed = signal(false);
  readonly skeletonSections = [1, 2];
  /** Gallery photos offered as one-click hero choices. */
  readonly galleryPhotos = signal<MediaItem[]>([]);
  /** The settings as last loaded/saved: the baseline for keeping the share image in step with the hero. */
  private baseline: SiteSettings | null = null;
  readonly language = signal<Language>('en');
  // Mirrors the backend limits (site-settings.schema.ts); beyond them the API answers 400.
  readonly maxNotices = 20;
  readonly maxFacilities = 30;
  readonly icons = SUGGESTED_ICONS;
  readonly otherIcon = OTHER_ICON;
  readonly maxSlides = MAX_SLIDES;
  readonly maxSocialLinks = MAX_SOCIAL_LINKS;
  readonly minInterval = MIN_INTERVAL;
  readonly maxInterval = MAX_INTERVAL;
  readonly platforms = SOCIAL_PLATFORMS;
  readonly otherPlatform = OTHER_PLATFORM;

  /** Hero slideshow photos in display order. */
  readonly slides = signal<string[]>([]);
  /** Progress text while photos upload, e.g. "Uploading 2 of 5…"; null when idle. */
  readonly uploadStatus = signal<string | null>(null);
  /** Address typed for "Add by address"; not part of the saved form. */
  readonly slideAddress = new FormControl('', { nonNullable: true });
  readonly slideAddressError = signal(false);

  readonly form = this.fb.group({
    en: createTranslatableGroup(this.fb, true),
    ms: createTranslatableGroup(this.fb, false),
    heroIntervalSeconds: [
      DEFAULT_INTERVAL,
      [Validators.required, Validators.min(MIN_INTERVAL), Validators.max(MAX_INTERVAL), wholeSeconds],
    ],
    address: [''],
    contactEmail: ['', Validators.email],
    contactPhone: [''],
    checkInTime: [''],
    checkOutTime: [''],
    notices: this.fb.array<NoticeGroup>([]),
    facilities: this.fb.array<FacilityGroup>([]),
    socialLinks: this.fb.array<SocialLinkGroup>([]),
  });

  get notices(): FormArray<NoticeGroup> {
    return this.form.controls.notices;
  }

  get facilities(): FormArray<FacilityGroup> {
    return this.form.controls.facilities;
  }

  get socialLinks(): FormArray<SocialLinkGroup> {
    return this.form.controls.socialLinks;
  }

  ngOnInit(): void {
    this.mediaService.list().subscribe({
      next: (items) => this.galleryPhotos.set(items.filter((item) => item.association.type === 'gallery')),
      error: () => this.galleryPhotos.set([]), // the picker is optional; the URL field still works
    });
    this.loadSettings();
  }

  /** Loads the settings into the form; on failure shows a retry message instead of a skeleton forever. */
  loadSettings(): void {
    this.loadFailed.set(false);
    this.siteSettingsService.getForAdmin().subscribe({
      next: (settings) => {
        this.patchForm(settings);
        this.loaded.set(true);
      },
      error: () => this.loadFailed.set(true),
    });
  }

  private fillTranslatable(
    group: TranslatableGroup,
    content: MalayContent,
    required: boolean,
  ): void {
    group.patchValue({
      heroHeadline: content.heroHeadline ?? '',
      heroSubheadline: content.heroSubheadline ?? '',
      aboutContent: content.aboutContent ?? '',
      hostIntro: content.hostIntro ?? '',
      cancellationPolicy: content.cancellationPolicy ?? '',
      privacyPolicy: content.privacyPolicy ?? '',
      termsAndConditions: content.termsAndConditions ?? '',
    });
    group.controls.houseRules.clear();
    for (const rule of content.houseRules ?? []) {
      group.controls.houseRules.push(createRuleControl(this.fb, required, rule));
    }
    group.controls.faqs.clear();
    for (const faq of content.faqs ?? []) {
      group.controls.faqs.push(createFaqGroup(this.fb, required, faq.question, faq.answer));
    }
  }

  private patchForm(settings: SiteSettings): void {
    this.fillTranslatable(this.form.controls.en, settings, true);
    this.fillTranslatable(this.form.controls.ms, settings.translations?.ms ?? {}, false);
    this.baseline = settings;
    this.slides.set(initialSlides(settings.heroImages, settings.heroImageUrl));
    this.form.patchValue({
      heroIntervalSeconds: settings.heroIntervalSeconds ?? DEFAULT_INTERVAL,
      address: settings.address,
      contactEmail: settings.contactEmail,
      contactPhone: settings.contactPhone,
      checkInTime: settings.checkInTime,
      checkOutTime: settings.checkOutTime,
    });

    this.notices.clear();
    for (const notice of settings.notices ?? []) {
      this.notices.push(createNoticeGroup(this.fb, notice));
    }
    this.facilities.clear();
    for (const facility of settings.facilities ?? []) {
      this.facilities.push(createFacilityGroup(this.fb, facility));
    }
    this.socialLinks.clear();
    for (const link of settings.socialLinks ?? []) {
      this.socialLinks.push(createSocialLinkGroup(this.fb, link));
    }
  }

  private markSlidesChanged(next: string[]): void {
    this.slides.set(next);
    this.form.markAsDirty();
  }

  /** Adds a gallery photo to the slideshow (duplicates are ignored). */
  addGallerySlide(url: string): void {
    if (this.slides().length >= MAX_SLIDES) {
      this.snackBar.open(`The slideshow can have at most ${MAX_SLIDES} photos`, 'Dismiss', { duration: 4000 });
      return;
    }
    this.markSlidesChanged(addSlide(this.slides(), url));
  }

  addSlideByAddress(): void {
    const value = this.slideAddress.value.trim();
    if (value === '' || !isHttpUrlOrEmpty(value)) {
      this.slideAddressError.set(true);
      return;
    }
    this.slideAddressError.set(false);
    this.addGallerySlide(value);
    this.slideAddress.setValue('');
  }

  moveSlide(index: number, offset: number): void {
    this.markSlidesChanged(moveSlide(this.slides(), index, offset));
  }

  removeSlide(index: number): void {
    this.markSlidesChanged(removeSlide(this.slides(), index));
  }

  /** Uploads the chosen photos one at a time, adding each to the slideshow as it finishes. */
  async uploadSlides(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length === 0 || this.uploadStatus() !== null) {
      return;
    }
    const room = MAX_SLIDES - this.slides().length;
    if (files.length > room) {
      this.snackBar.open(
        `The slideshow can have at most ${MAX_SLIDES} photos; only the first ${room} will be uploaded`,
        'Dismiss',
        { duration: 5000 },
      );
    }
    const chosen = files.slice(0, Math.max(room, 0));
    for (const [index, file] of chosen.entries()) {
      this.uploadStatus.set(`Uploading ${index + 1} of ${chosen.length}…`);
      try {
        const { url } = await this.mediaService.uploadRaw(file, 'homestay/hero');
        this.markSlidesChanged(addSlide(this.slides(), url));
      } catch {
        this.snackBar.open(`Could not upload ${file.name}`, 'Dismiss', { duration: 5000 });
      }
    }
    this.uploadStatus.set(null);
  }

  addSocialLink(): void {
    this.socialLinks.push(createSocialLinkGroup(this.fb));
  }

  removeSocialLink(index: number): void {
    this.socialLinks.removeAt(index);
  }

  setLanguage(language: Language): void {
    this.language.set(language);
  }

  addRule(group: TranslatableGroup, required: boolean): void {
    group.controls.houseRules.push(createRuleControl(this.fb, required));
  }

  removeRule(group: TranslatableGroup, index: number): void {
    group.controls.houseRules.removeAt(index);
  }

  addFaq(group: TranslatableGroup, required: boolean): void {
    group.controls.faqs.push(createFaqGroup(this.fb, required));
  }

  removeFaq(group: TranslatableGroup, index: number): void {
    group.controls.faqs.removeAt(index);
  }

  addNotice(): void {
    this.notices.push(createNoticeGroup(this.fb));
  }

  removeNotice(index: number): void {
    this.notices.removeAt(index);
  }

  addFacility(): void {
    this.facilities.push(createFacilityGroup(this.fb));
  }

  removeFacility(index: number): void {
    this.facilities.removeAt(index);
  }

  onIconChoice(group: FacilityGroup, choice: string): void {
    if (choice !== OTHER_ICON) {
      group.controls.icon.setValue(choice);
    } else {
      group.controls.icon.setValue('');
    }
  }

  save(): void {
    if (this.form.invalid) {
      // Show the tab that has the problem rather than leaving Save inert.
      // Everything except the Malay group (including the slideshow interval, contacts, notices,
      // facilities and social links) is on the English view; go to Malay only when Malay is the sole problem.
      const englishViewInvalid = Object.entries(this.form.controls).some(([key, control]) => key !== 'ms' && control.invalid);
      this.setLanguage(englishViewInvalid ? 'en' : 'ms');
      this.form.markAllAsTouched();
      this.snackBar.open('Fix the highlighted fields', 'Dismiss', { duration: 5000 });
      return;
    }

    const raw = this.form.getRawValue();
    const en = raw.en;
    const slides = this.slides();
    const hero = slides[0] ?? '';
    const baseHero = this.baseline?.heroImageUrl ?? '';
    const baseSeo = this.baseline?.seoDefaults ?? { title: '', description: '', shareImageUrl: '' };
    this.siteSettingsService
      .update({
        heroHeadline: en.heroHeadline,
        heroSubheadline: en.heroSubheadline,
        aboutContent: en.aboutContent,
        hostIntro: en.hostIntro,
        cancellationPolicy: en.cancellationPolicy,
        privacyPolicy: en.privacyPolicy,
        termsAndConditions: en.termsAndConditions,
        houseRules: en.houseRules,
        faqs: en.faqs.map((faq, index) => ({ ...faq, order: index })),
        heroImages: slides,
        heroImageUrl: hero,
        heroIntervalSeconds: raw.heroIntervalSeconds,
        seoDefaults: { ...baseSeo, shareImageUrl: nextShareImage(baseHero, baseSeo.shareImageUrl, hero) },
        address: raw.address,
        contactEmail: raw.contactEmail,
        contactPhone: raw.contactPhone,
        checkInTime: raw.checkInTime,
        checkOutTime: raw.checkOutTime,
        notices: toNotices(this.notices.controls),
        facilities: toFacilities(this.facilities.controls),
        socialLinks: toSocialLinks(this.socialLinks.controls),
        translations: { ms: toMalayContent(this.form.controls.ms) },
      })
      .subscribe({
        next: (saved) => {
          this.baseline = saved;
          this.snackBar.open('Site content saved', 'Dismiss', { duration: 3000 });
        },
        error: (error: unknown) => {
          const invalid = error instanceof HttpErrorResponse && error.status === 400;
          this.snackBar.open(
            invalid ? 'Check the highlighted fields' : 'Could not save changes. Please try again.',
            'Dismiss',
            { duration: 4000 },
          );
        },
      });
  }
}
