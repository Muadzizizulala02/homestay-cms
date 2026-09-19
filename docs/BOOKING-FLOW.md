# Booking Flow

Status: the full guest journey through payment is implemented, including server-side webhook verification. Only the confirmation *email* (step 9) remains — Phase 8.

## Guest journey

1. ✅ Pick an accommodation/unit (from the Accommodation list/detail pages)
2. ✅ Pick check-in/check-out dates and guest count (a small widget on the accommodation detail page, pre-filling `/booking`'s date/guest fields via query params)
3. ✅ Live availability check (`GET /accommodations/:id/availability`) — client-side min/max-stay and capacity checks run first for instant feedback, then the real availability check hits the server
4. ⏳ Priced breakdown shown *before* booking creation — not built; the authoritative price (nights × rate, any seasonal adjustment) is only shown *after* creation succeeds, on the confirmation step, since it's computed server-side in `createBooking` itself and there's no separate "quote" endpoint. Not a security issue (the price a guest is charged is never client-supplied either way) — just means the guest doesn't see it until after committing to create the booking record.
5. ✅ Enter guest details (name, email, phone, notes)
6. ✅ Review and confirm — client-side review screen, then `POST /bookings` (server-side validation + the transactional availability check + real pricing all happen here)
7. ✅ Redirect to Billplz-hosted payment page (see `PAYMENT.md`) — `POST /bookings/:id/payment` creates the bill and returns its URL; the frontend does this automatically right after booking creation succeeds and redirects the browser (`window.location.href`)
8. ✅ Billplz webhook confirms payment server-side (`POST /payments/webhook/billplz`, signature-verified)
9. ⏳ Confirmation email — not built (Phase 8). Today's confirmation is in-page only.

**Fallback behavior**: if payment creation fails (most likely today, since this environment has no real Billplz credentials configured) or Billplz isn't configured at all, the guest simply stays on the in-page confirmation showing their booking reference and a "we'll contact you to arrange payment" message — a missing/broken payment gateway never blocks a guest from completing a booking record.

No account creation at any point. A guest who wants to check on a booking later uses `GET /bookings/lookup?reference=&email=` (✅ implemented backend; no dedicated frontend page yet — the confirmation step shows the reference directly, so there's been no UI need for a separate lookup page yet).

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

Admin-initiated only. ✅ `POST /admin/bookings/:id/refund` (backend only — no admin bookings screen exists yet to call it from) records the payment as `refunded` and cancels the booking. It does not move any money: Billplz has no refund API, so the admin must process the actual refund manually in the Billplz dashboard first — see `PAYMENT.md`. Self-service guest cancellation is an open decision — see `PROJECT-OVERVIEW.md`.
