# Payment

Status: planned, not yet implemented. `stripe` and `@stripe/stripe-js` remain in `package.json` from the original scaffold but are unused and slated for removal (see decision below).

## Gateway decision

> **Decision:** Use Billplz, not Stripe or Curlec (Razorpay Malaysia).
> **Reason:** FPX (online banking transfer) is the dominant online payment method for Malaysian consumers, and homestay bookings are typically single, moderate-value transactions. Billplz charges a flat RM0.75–1.25 per FPX transaction; Stripe charges ~3%+RM1 — roughly 4x more expensive on a typical booking. Confirmed with the product owner on 2026-09-19.
> **Impact:** The Stripe SDK dependencies already present in the scaffold (`@stripe/stripe-js` in the frontend, `stripe` in `functions/`) should be removed to avoid dead dependencies, unless kept deliberately as a documented future second option.

| | Billplz (chosen) | Stripe | Curlec |
|---|---|---|---|
| MY support | Native | Officially launched, FPX+cards, no DuitNow/local e-wallets | Native, BNM-regulated, PayNet member |
| Setup/monthly | RM0 (Basic) | RM0 | RM0 (Basic) / RM999 (Premium) |
| FPX fee | RM0.75–1.25 flat | 3% + RM1 | 1–1.5% or RM1 |
| Cards | 2.5%, min RM0.65 | 3% + RM1 (+1% intl) | 2.0–2.4% |
| Settlement | Next business day | 7-day rolling | Not confirmed |

## Server-side verification (non-negotiable)

> **Decision:** The frontend never marks a booking as paid. Payment status only changes to `paid` after the backend independently verifies a Billplz webhook.
> **Reason:** Any value coming from the browser (including a redirect query parameter claiming success) can be manipulated by the client. Only a verified server-to-server signal is trustworthy.
> **Impact:** Payment status must only become `paid` after verified gateway confirmation, never from a frontend event.

Flow:
1. Backend creates a Billplz "bill" via the Billplz API, tied to a `pending_payment` booking.
2. Guest is redirected to Billplz's hosted payment page.
3. On completion, Billplz calls our webhook: `POST /api/v1/payments/webhook/billplz`.
4. The webhook handler recomputes the `X-Signature` HMAC over the payload and compares it to the one Billplz sent — the payload is discarded if it doesn't match.
5. Only after signature verification does a Firestore transaction flip `payments/{id}.status` to `paid` and `bookings/{id}.status` to `confirmed`.
6. The browser's redirect back to our site is UX only (a "processing" state) — the confirmation page re-fetches real status from our API, it never trusts the redirect's query string.

## Refunds

Admin-triggered from the booking detail screen; calls the Billplz refund API, updates `payments/{id}.status` to `refunded` or `partially_refunded`.
