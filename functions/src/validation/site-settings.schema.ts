import { z } from 'zod';

const faqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  order: z.number().int(),
});

// http(s) only: z.string().url() alone also accepts javascript: and data: URLs.
const httpUrl = z
  .string()
  .url()
  .refine((value) => /^https?:\/\//i.test(value), 'Expected an http(s) URL');

const socialLinkSchema = z.object({
  platform: z.string().min(1),
  url: httpUrl,
});

const noticeSchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().min(1).max(120),
  body: z.string().max(1000),
  titleMs: z.string().max(120).optional(),
  bodyMs: z.string().max(1000).optional(),
  important: z.boolean(),
  active: z.boolean(),
});

const facilitySchema = z.object({
  // A Material icon name: lowercase letters, digits, underscores only.
  icon: z.string().regex(/^[a-z0-9_]{1,40}$/, 'Expected a Material icon name, e.g. "wifi"'),
  label: z.string().min(1).max(60),
  description: z.string().max(300),
  labelMs: z.string().max(60).optional(),
  descriptionMs: z.string().max(300).optional(),
});

const malayContentSchema = z.object({
  heroHeadline: z.string().optional(),
  heroSubheadline: z.string().optional(),
  aboutContent: z.string().optional(),
  hostIntro: z.string().optional(),
  cancellationPolicy: z.string().optional(),
  privacyPolicy: z.string().max(20000).optional(),
  termsAndConditions: z.string().max(20000).optional(),
  houseRules: z.array(z.string()).optional(),
  faqs: z.array(faqItemSchema).optional(),
});

const urlOrEmpty = z.union([httpUrl, z.literal('')]);
const emailOrEmpty = z.union([z.string().email(), z.literal('')]);

export const updateSiteSettingsSchema = z.object({
  heroHeadline: z.string().min(1).optional(),
  heroSubheadline: z.string().optional(),
  heroImageUrl: urlOrEmpty.optional(),
  heroImages: z.array(httpUrl).max(10).optional(),
  heroIntervalSeconds: z.number().int().min(2).max(30).optional(),
  aboutContent: z.string().optional(),
  hostIntro: z.string().optional(),
  address: z.string().optional(),
  geo: z.object({ lat: z.number(), lng: z.number() }).optional(),
  contactEmail: emailOrEmpty.optional(),
  contactPhone: z.string().optional(),
  socialLinks: z.array(socialLinkSchema).optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  houseRules: z.array(z.string()).optional(),
  faqs: z.array(faqItemSchema).optional(),
  cancellationPolicy: z.string().optional(),
  privacyPolicy: z.string().max(20000).optional(),
  termsAndConditions: z.string().max(20000).optional(),
  notices: z.array(noticeSchema).max(20).optional(),
  facilities: z.array(facilitySchema).max(30).optional(),
  translations: z.object({ ms: malayContentSchema }).optional(),
  // One optional photo per home section; '' (or absent) keeps the default design. Zod drops unknown keys.
  sectionBackgrounds: z
    .object({
      rooms: urlOrEmpty.optional(),
      facilities: urlOrEmpty.optional(),
      steps: urlOrEmpty.optional(),
      rules: urlOrEmpty.optional(),
      about: urlOrEmpty.optional(),
    })
    .optional(),
  seoDefaults: z
    .object({ title: z.string(), description: z.string(), shareImageUrl: z.string() })
    .optional(),
});
