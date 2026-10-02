import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

const guestDetailsSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().min(5).max(30),
  notes: z.string().max(1000).optional(),
});

export const createBookingSchema = z.object({
  accommodationId: z.string().min(1),
  checkInDate: isoDate,
  checkOutDate: isoDate,
  guestCount: z.number().int().positive(),
  guest: guestDetailsSchema,
});

export const availabilityQuerySchema = z.object({
  from: isoDate,
  to: isoDate,
});

export const bookingLookupQuerySchema = z.object({
  reference: z.string().min(1),
  email: z.string().email(),
});
