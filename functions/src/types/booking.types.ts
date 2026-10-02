import type { Timestamp } from 'firebase-admin/firestore';

export type BookingStatus = 'pending_payment' | 'confirmed' | 'completed' | 'cancelled' | 'expired';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';

export interface PriceLine {
  /** YYYY-MM-DD for a per-night line. */
  label: string;
  amount: number;
}

export interface PriceBreakdown {
  nights: number;
  lines: PriceLine[];
  total: number;
  currency: 'MYR';
}

export interface GuestDetails {
  name: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface Booking {
  id: string;
  reference: string;
  accommodationId: string;
  /** YYYY-MM-DD */
  checkInDate: string;
  /** YYYY-MM-DD */
  checkOutDate: string;
  guestCount: number;
  guest: GuestDetails;
  price: PriceBreakdown;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  /** Set while status is pending_payment; null once confirmed/cancelled/expired. */
  holdExpiresAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
