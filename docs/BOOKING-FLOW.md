# Booking Flow

Status: planned, not yet implemented.

## Guest journey

1. Pick check-in/check-out dates and guest count (from Home or Accommodation page)
2. Live availability check against `accommodations/{id}/availability`
3. Pick an accommodation/unit
4. See a priced breakdown (nights × rate, any seasonal adjustment, shown line by line) — computed server-side
5. Enter guest details (name, email, phone, notes)
6. Review and confirm
7. Redirect to Billplz-hosted payment page (see `PAYMENT.md`)
8. Billplz webhook confirms payment server-side
9. Confirmation page + email with booking reference

No account creation at any point. A guest who wants to check on a booking later uses `/booking/lookup` with their reference + email.

## Statuses

**Booking**: `pending_payment` → `confirmed` → `completed` (after the checkout date passes) | `cancelled` | `expired`

**Payment**: `pending` → `paid` | `failed` | `refunded` | `partially_refunded`

## Pricing rules

- Base nightly rate per accommodation, with optional weekend/seasonal override rules (day-of-week rate, or date-range overrides for peak/holiday periods)
- Min/max stay enforced server-side
- Total always recalculated server-side at booking creation — never trusts a client-submitted amount

## Reference numbers

Short, human-readable code generated at booking creation: `BK-YYYYMMDD-XXXX`. Used in confirmation emails and the no-account lookup page.

## Time zones

All storage in UTC; all display in Asia/Kuala_Lumpur (MYT, no DST) — single-country site, no timezone selector needed anywhere.

## Expiry

A `pending_payment` booking holds its dates for ~20 minutes. A scheduled sweep (every 5 minutes) expires stale pending bookings and releases their date-availability documents. See `DATABASE.md` for the underlying mechanism.

## Refunds / cancellations (v1)

Admin-initiated only, from the booking detail screen in the CMS: triggers a Billplz refund API call, updates payment status, and (per the site's cancellation policy) may auto-cancel the booking. Self-service guest cancellation is an open decision — see `PROJECT-OVERVIEW.md`.
