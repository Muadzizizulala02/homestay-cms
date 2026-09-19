import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase-admin/firestore';
import { calculatePrice } from '../pricing.service';
import { AppError } from '../../utils/app-error';
import type { Accommodation } from '../../types/accommodation.types';

function makeAccommodation(overrides: Partial<Accommodation> = {}): Accommodation {
  return {
    id: 'acc-1',
    slug: 'garden-room',
    name: 'Garden Room',
    description: '',
    photos: [],
    capacity: 2,
    beds: 1,
    amenities: [],
    basePrice: 150,
    minStay: 1,
    maxStay: 14,
    active: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
  };
}

// 2026-10-01 is a Thursday, 2026-10-02 Friday, 2026-10-03 Saturday.
describe('calculatePrice', () => {
  it('charges the base rate per night with no overrides', () => {
    const result = calculatePrice(makeAccommodation(), '2026-10-01', '2026-10-04');
    expect(result.nights).toBe(3);
    expect(result.total).toBe(450);
    expect(result.lines).toEqual([
      { label: '2026-10-01', amount: 150 },
      { label: '2026-10-02', amount: 150 },
      { label: '2026-10-03', amount: 150 },
    ]);
  });

  it('applies a weekend rate override', () => {
    const acc = makeAccommodation({ weekdayRates: [{ daysOfWeek: [5, 6], nightlyRate: 200 }] });
    const result = calculatePrice(acc, '2026-10-01', '2026-10-04');
    expect(result.total).toBe(150 + 200 + 200);
  });

  it('applies a seasonal rate override over the weekday rate', () => {
    const acc = makeAccommodation({
      weekdayRates: [{ daysOfWeek: [5, 6], nightlyRate: 200 }],
      seasonalRates: [
        { id: 's1', label: 'Peak', startDate: '2026-10-02', endDate: '2026-10-03', nightlyRate: 300 },
      ],
    });
    const result = calculatePrice(acc, '2026-10-01', '2026-10-04');
    expect(result.total).toBe(150 + 300 + 300);
  });

  it('rejects a stay shorter than the minimum', () => {
    const acc = makeAccommodation({ minStay: 2 });
    expect(() => calculatePrice(acc, '2026-10-01', '2026-10-02')).toThrow(AppError);
  });

  it('rejects a stay longer than the maximum', () => {
    const acc = makeAccommodation({ maxStay: 2 });
    expect(() => calculatePrice(acc, '2026-10-01', '2026-10-05')).toThrow(AppError);
  });

  it('rejects a checkout date that is not after check-in', () => {
    expect(() => calculatePrice(makeAccommodation(), '2026-10-01', '2026-10-01')).toThrow(AppError);
  });
});
