import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import type { Facility, MalayContent, Notice, SocialLink } from '../../shared/services/site-settings.service';

export const ICON_PATTERN = /^[a-z0-9_]{1,40}$/;
export const MAX_POLICY_LENGTH = 20000;
export const MAX_SLIDES = 10;
export const MAX_SOCIAL_LINKS = 8;
export const OTHER_ICON = '__other__';

export const SUGGESTED_ICONS: readonly string[] = [
  'wifi',
  'local_parking',
  'pool',
  'free_breakfast',
  'ac_unit',
  'kitchen',
  'local_laundry_service',
  'tv',
  'pets',
  'smoke_free',
  'security',
  'cleaning_services',
];

export type FaqGroup = FormGroup<{ question: FormControl<string>; answer: FormControl<string> }>;

export type TranslatableGroup = FormGroup<{
  heroHeadline: FormControl<string>;
  heroSubheadline: FormControl<string>;
  aboutContent: FormControl<string>;
  hostIntro: FormControl<string>;
  cancellationPolicy: FormControl<string>;
  privacyPolicy: FormControl<string>;
  termsAndConditions: FormControl<string>;
  houseRules: FormArray<FormControl<string>>;
  faqs: FormArray<FaqGroup>;
}>;

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Optional (Malay) FAQ rows may be left empty, but a half-filled row would be dropped without a
 * word when saved, so it is an error: fill both fields or clear the row.
 */
function questionAndAnswerTogether(group: AbstractControl): ValidationErrors | null {
  const question = String(group.get('question')?.value ?? '').trim();
  const answer = String(group.get('answer')?.value ?? '').trim();
  return (question === '') !== (answer === '') ? { incompleteFaq: true } : null;
}

export function createFaqGroup(fb: NonNullableFormBuilder, required: boolean, question = '', answer = ''): FaqGroup {
  const validators = required ? [Validators.required] : [];
  return fb.group(
    {
      question: [question, validators],
      answer: [answer, validators],
    },
    required ? {} : { validators: [questionAndAnswerTogether] },
  );
}

export function createRuleControl(fb: NonNullableFormBuilder, required: boolean, value = ''): FormControl<string> {
  return fb.control(value, required ? [Validators.required] : []);
}

/** Builds the group of translatable text fields; used for English (required) and Malay (optional). */
export function createTranslatableGroup(fb: NonNullableFormBuilder, english: boolean): TranslatableGroup {
  return fb.group({
    heroHeadline: ['', english ? [Validators.required] : []],
    heroSubheadline: [''],
    aboutContent: [''],
    hostIntro: [''],
    cancellationPolicy: [''],
    privacyPolicy: ['', [Validators.maxLength(MAX_POLICY_LENGTH)]],
    termsAndConditions: ['', [Validators.maxLength(MAX_POLICY_LENGTH)]],
    houseRules: fb.array<FormControl<string>>([]),
    faqs: fb.array<FaqGroup>([]),
  });
}

export function createNoticeGroup(fb: NonNullableFormBuilder, notice?: Notice) {
  return fb.group({
    id: [notice?.id ?? newId()],
    title: [notice?.title ?? '', [Validators.required, Validators.maxLength(120)]],
    body: [notice?.body ?? '', [Validators.maxLength(1000)]],
    titleMs: [notice?.titleMs ?? '', [Validators.maxLength(120)]],
    bodyMs: [notice?.bodyMs ?? '', [Validators.maxLength(1000)]],
    important: [notice?.important ?? false],
    active: [notice?.active ?? true],
  });
}

export type NoticeGroup = ReturnType<typeof createNoticeGroup>;

export function createFacilityGroup(fb: NonNullableFormBuilder, facility?: Facility) {
  const icon = facility?.icon ?? 'wifi';
  const known = SUGGESTED_ICONS.includes(icon);
  return fb.group({
    iconChoice: [known ? icon : OTHER_ICON],
    icon: [icon, [Validators.required, Validators.pattern(ICON_PATTERN)]],
    label: [facility?.label ?? '', [Validators.required, Validators.maxLength(60)]],
    description: [facility?.description ?? '', [Validators.maxLength(300)]],
    labelMs: [facility?.labelMs ?? '', [Validators.maxLength(60)]],
    descriptionMs: [facility?.descriptionMs ?? '', [Validators.maxLength(300)]],
  });
}

export type FacilityGroup = ReturnType<typeof createFacilityGroup>;

function optional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export function toNotices(groups: NoticeGroup[]): Notice[] {
  return groups
    .map((g) => g.getRawValue())
    .filter((n) => n.title.trim() !== '')
    .map((n) => ({
      id: n.id,
      title: n.title.trim(),
      body: n.body.trim(),
      titleMs: optional(n.titleMs),
      bodyMs: optional(n.bodyMs),
      important: n.important,
      active: n.active,
    }));
}

export function toFacilities(groups: FacilityGroup[]): Facility[] {
  return groups
    .map((g) => g.getRawValue())
    .filter((f) => f.label.trim() !== '')
    .map((f) => ({
      icon: f.icon.trim(),
      label: f.label.trim(),
      description: f.description.trim(),
      labelMs: optional(f.labelMs),
      descriptionMs: optional(f.descriptionMs),
    }));
}

export function toMalayContent(group: TranslatableGroup): MalayContent {
  const v = group.getRawValue();
  return {
    heroHeadline: optional(v.heroHeadline),
    heroSubheadline: optional(v.heroSubheadline),
    aboutContent: optional(v.aboutContent),
    hostIntro: optional(v.hostIntro),
    cancellationPolicy: optional(v.cancellationPolicy),
    privacyPolicy: optional(v.privacyPolicy),
    termsAndConditions: optional(v.termsAndConditions),
    houseRules: v.houseRules.map((r) => r.trim()).filter((r) => r !== ''),
    faqs: v.faqs
      .filter((f) => f.question.trim() !== '' && f.answer.trim() !== '')
      .map((f, order) => ({ question: f.question.trim(), answer: f.answer.trim(), order })),
  };
}

/** http(s) addresses only, or empty for "no hero image" (matches the API's schema). */
export function isHttpUrlOrEmpty(value: string): boolean {
  const trimmed = value.trim();
  return trimmed === '' || /^https?:\/\/\S+$/i.test(trimmed);
}

/**
 * The social-share image normally mirrors the hero. Keep them in step only when they matched
 * before (or the share image was empty), so a share image the owner set on purpose is never
 * overwritten by changing the hero.
 */
export function nextShareImage(previousHero: string, previousShare: string, newHero: string): string {
  const followedHero = previousShare === '' || previousShare === previousHero;
  return followedHero ? newHero : previousShare;
}


/** Adds a slide at the end; ignores blank addresses, duplicates and anything past the limit. */
export function addSlide(slides: readonly string[], url: string, max = MAX_SLIDES): string[] {
  const trimmed = url.trim();
  if (trimmed === '' || slides.includes(trimmed) || slides.length >= max) {
    return [...slides];
  }
  return [...slides, trimmed];
}

export function removeSlide(slides: readonly string[], index: number): string[] {
  return slides.filter((_, i) => i !== index);
}

/** Moves a slide by `offset` places (-1 up, +1 down); out-of-range moves change nothing. */
export function moveSlide(slides: readonly string[], index: number, offset: number): string[] {
  const target = index + offset;
  if (index < 0 || index >= slides.length || target < 0 || target >= slides.length) {
    return [...slides];
  }
  const next = [...slides];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** Initial slides: the saved list, or the single legacy hero image when the list is empty. */
export function initialSlides(heroImages: readonly string[] | undefined, heroImageUrl: string | undefined): string[] {
  if (heroImages && heroImages.length > 0) {
    return [...heroImages];
  }
  return heroImageUrl ? [heroImageUrl] : [];
}

export const SOCIAL_PLATFORMS: readonly string[] = ['Facebook', 'Instagram', 'TikTok', 'WhatsApp', 'YouTube', 'X'];
export const OTHER_PLATFORM = '__other__';

/** Maps a stored platform name to the select choice plus custom name (for "Other"). */
export function platformChoice(platform: string): { choice: string; custom: string } {
  const known = SOCIAL_PLATFORMS.find((name) => name.toLowerCase() === platform.trim().toLowerCase());
  return known ? { choice: known, custom: '' } : { choice: OTHER_PLATFORM, custom: platform };
}

/** A filled-in address must be http(s); a blank row is allowed and simply not saved. */
function httpUrlValidator(control: AbstractControl): ValidationErrors | null {
  return isHttpUrlOrEmpty(String(control.value ?? '')) ? null : { url: true };
}

/** "Other" needs a platform name once the row has an address. */
function customPlatformRequired(group: AbstractControl): ValidationErrors | null {
  const choice = group.get('platform')?.value;
  const custom = String(group.get('customPlatform')?.value ?? '').trim();
  const url = String(group.get('url')?.value ?? '').trim();
  return choice === OTHER_PLATFORM && custom === '' && url !== '' ? { platformName: true } : null;
}

export function createSocialLinkGroup(fb: NonNullableFormBuilder, link?: SocialLink) {
  const { choice, custom } = platformChoice(link?.platform ?? SOCIAL_PLATFORMS[0]);
  return fb.group(
    {
      platform: [choice],
      customPlatform: [custom, [Validators.maxLength(40)]],
      url: [link?.url ?? '', [httpUrlValidator, Validators.maxLength(2000)]],
    },
    { validators: [customPlatformRequired] },
  );
}

export type SocialLinkGroup = ReturnType<typeof createSocialLinkGroup>;

/** Rows with a blank address are dropped; the rest are saved with a trimmed platform and address. */
export function toSocialLinks(groups: readonly SocialLinkGroup[]): SocialLink[] {
  return groups
    .map((g) => g.getRawValue())
    .filter((row) => row.url.trim() !== '')
    .map((row) => ({
      platform: row.platform === OTHER_PLATFORM ? row.customPlatform.trim() : row.platform,
      url: row.url.trim(),
    }));
}
