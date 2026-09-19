import { AppError } from '../utils/app-error';
import type { Accommodation, DayOfWeek } from '../types/accommodation.types';
import type { PriceBreakdown, PriceLine } from '../types/booking.types';

function toDateOnlyUtc(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00Z`);
}

/** One entry per night, e.g. checkIn=2026-10-01, checkOut=2026-10-04 -> [10-01, 10-02, 10-03]. */
export function enumerateNightsForRange(checkInDate: string, checkOutDate: string): string[] {
  const nights: string[] = [];
  let cursor = toDateOnlyUtc(checkInDate);
  const end = toDateOnlyUtc(checkOutDate);

  while (cursor.getTime() < end.getTime()) {
    nights.push(cursor.toISOString().slice(0, 10));
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }

  return nights;
}

function rateForNight(accommodation: Accommodation, date: string): number {
  const seasonal = accommodation.seasonalRates?.find(
    (rate) => date >= rate.startDate && date <= rate.endDate
  );
  if (seasonal) {
    return seasonal.nightlyRate;
  }

  const dayOfWeek = toDateOnlyUtc(date).getUTCDay() as DayOfWeek;
  const weekday = accommodation.weekdayRates?.find((rate) => rate.daysOfWeek.includes(dayOfWeek));
  if (weekday) {
    return weekday.nightlyRate;
  }

  return accommodation.basePrice;
}

/**
 * Computes the price breakdown for a stay. Always the source of truth for a booking's
 * total — a client-submitted price is never trusted (see docs/PAYMENT.md).
 */
export function calculatePrice(
  accommodation: Accommodation,
  checkInDate: string,
  checkOutDate: string
): PriceBreakdown {
  const nights = enumerateNightsForRange(checkInDate, checkOutDate);

  if (nights.length === 0) {
    throw new AppError(400, 'Check-out date must be after check-in date', 'INVALID_DATE_RANGE');
  }
  if (nights.length < accommodation.minStay) {
    throw new AppError(400, `Minimum stay is ${accommodation.minStay} night(s)`, 'BELOW_MIN_STAY');
  }
  if (nights.length > accommodation.maxStay) {
    throw new AppError(400, `Maximum stay is ${accommodation.maxStay} night(s)`, 'ABOVE_MAX_STAY');
  }

  const lines: PriceLine[] = nights.map((date) => ({
    label: date,
    amount: rateForNight(accommodation, date),
  }));
  const total = lines.reduce((sum, line) => sum + line.amount, 0);

  return { nights: nights.length, lines, total, currency: 'MYR' };
}
