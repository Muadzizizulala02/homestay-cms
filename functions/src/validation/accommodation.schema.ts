import { z } from 'zod';

const weekdayRateSchema = z.object({
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1),
  nightlyRate: z.number().positive(),
});

const seasonalRateSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
  nightlyRate: z.number().positive(),
});

// Cross-field checks (minStay <= maxStay, slug uniqueness) live in accommodation.service —
// a partial update can't validate against the merged record here without reading the DB first.
const baseAccommodationSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase, alphanumeric, hyphen-separated'),
  name: z.string().min(1).max(120),
  description: z.string().max(5000).default(''),
  photos: z.array(z.string().url()).default([]),
  capacity: z.number().int().positive(),
  beds: z.number().int().positive(),
  amenities: z.array(z.string().min(1)).default([]),
  basePrice: z.number().positive(),
  weekdayRates: z.array(weekdayRateSchema).optional(),
  seasonalRates: z.array(seasonalRateSchema).optional(),
  minStay: z.number().int().positive().default(1),
  maxStay: z.number().int().positive().default(30),
  active: z.boolean().default(true),
});

export const createAccommodationSchema = baseAccommodationSchema;
export const updateAccommodationSchema = baseAccommodationSchema.partial();

export const idParamSchema = z.object({
  id: z.string().min(1),
});
