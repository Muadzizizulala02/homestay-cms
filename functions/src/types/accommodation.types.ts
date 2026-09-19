import type { Timestamp } from 'firebase-admin/firestore';

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** A nightly rate override for a fixed date range (e.g. a peak/holiday season). */
export interface SeasonalRate {
  id: string;
  label: string;
  /** Inclusive, YYYY-MM-DD */
  startDate: string;
  /** Inclusive, YYYY-MM-DD */
  endDate: string;
  nightlyRate: number;
}

/** A nightly rate override for specific days of the week (e.g. weekends). */
export interface WeekdayRate {
  daysOfWeek: DayOfWeek[];
  nightlyRate: number;
}

export interface Accommodation {
  id: string;
  slug: string;
  name: string;
  description: string;
  photos: string[];
  capacity: number;
  beds: number;
  amenities: string[];
  basePrice: number;
  weekdayRates?: WeekdayRate[];
  seasonalRates?: SeasonalRate[];
  minStay: number;
  maxStay: number;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type AvailabilityStatus = 'booked' | 'blocked';

/** One document per night, at accommodations/{id}/availability/{YYYY-MM-DD}. */
export interface AvailabilityDoc {
  status: AvailabilityStatus;
  bookingId: string | null;
  createdAt: Timestamp;
}
