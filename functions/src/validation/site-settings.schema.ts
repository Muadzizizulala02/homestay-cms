import { z } from 'zod';

const faqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  order: z.number().int(),
});

const socialLinkSchema = z.object({
  platform: z.string().min(1),
  url: z.string().url(),
});

const urlOrEmpty = z.union([z.string().url(), z.literal('')]);
const emailOrEmpty = z.union([z.string().email(), z.literal('')]);

export const updateSiteSettingsSchema = z.object({
  heroHeadline: z.string().min(1).optional(),
  heroSubheadline: z.string().optional(),
  heroImageUrl: urlOrEmpty.optional(),
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
  seoDefaults: z
    .object({ title: z.string(), description: z.string(), shareImageUrl: z.string() })
    .optional(),
});
