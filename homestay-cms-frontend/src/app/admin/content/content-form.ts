import { FormArray, FormControl, FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import type { Facility, MalayContent, Notice } from '../../shared/services/site-settings.service';

export const ICON_PATTERN = /^[a-z0-9_]{1,40}$/;
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
  houseRules: FormArray<FormControl<string>>;
  faqs: FormArray<FaqGroup>;
}>;

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function createFaqGroup(fb: NonNullableFormBuilder, required: boolean, question = '', answer = ''): FaqGroup {
  const validators = required ? [Validators.required] : [];
  return fb.group({
    question: [question, validators],
    answer: [answer, validators],
  });
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
    houseRules: v.houseRules.map((r) => r.trim()).filter((r) => r !== ''),
    faqs: v.faqs
      .filter((f) => f.question.trim() !== '' && f.answer.trim() !== '')
      .map((f, order) => ({ question: f.question.trim(), answer: f.answer.trim(), order })),
  };
}
