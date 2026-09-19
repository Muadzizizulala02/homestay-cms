# Payment

Status: implemented — bill creation, webhook verification, and a (dashboard-manual) refund recording action are all live. The Stripe SDK dependencies from the original scaffold were already removed in Phase 2.

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

Flow (all ✅ implemented in `functions/src/services/payment.service.ts`):
1. `createPaymentForBooking(bookingId)` creates a Billplz "bill" via `POST {BILLPLZ_BASE_URL}/api/v3/bills` (HTTP Basic Auth, secret key as username, empty password; amount in cents), tied to a `pending_payment` booking. Called from `POST /bookings/:id/payment` — deliberately a separate call from booking creation itself, never inside the booking transaction, since an external HTTP call inside a retryable Firestore transaction risks creating duplicate bills if the transaction retries. If a `pending` payment already exists for the booking (e.g. the guest reloaded the page), the existing bill is reused rather than creating a second one.
2. Guest is redirected to Billplz's hosted payment page (`bill.url`).
3. On completion, Billplz calls our webhook: `POST /api/v1/payments/webhook/billplz` (form-encoded, not JSON — `app.ts` registers `express.urlencoded()` specifically for this).
4. `verifyBillplzSignature()` recomputes the X-Signature: every field except `x_signature` is sorted by key (ascending, case-insensitive), concatenated as `key+value` pairs joined by `|`, HMAC-SHA256'd with the X Signature key, and compared to the provided value with `crypto.timingSafeEqual` — the payload is rejected (401) if it doesn't match.
5. Only after signature verification does a Firestore transaction flip `payments/{id}.status` to `paid` (or `failed`, if `paid !== 'true'`) and, on success, `bookings/{id}.status` to `confirmed`.
6. The browser's redirect back to our site (`redirect_url`, pointed at `/booking/confirmation?reference=...`) is UX only — nothing there is trusted; only the webhook can ever move a payment to `paid`.

**Local testing note**: Billplz cannot reach `localhost`. Testing the webhook end-to-end locally needs a public tunnel (e.g. `ngrok http 5001`) with `API_BASE_URL` pointed at the tunnel URL — not something this environment has been able to exercise; verified instead via `payment.service.test.ts` with a mocked `fetch` and a locally-computed valid signature.

## Refunds

> **Correction to the original plan**: Billplz has **no refund API** — confirmed directly against their API documentation. "Only due Bills can be deleted. Paid Bills cannot be deleted," and no refund endpoint exists across v3–v5. Refunds are dashboard-only.
> **Impact:** `markPaymentRefunded(bookingId)` (admin-only, `POST /admin/bookings/:id/refund`) does not move any money — it only updates our own `payments/{id}.status` to `refunded` and cancels the booking, and only after the admin has processed the actual refund manually in the Billplz dashboard themselves. There is no admin bookings screen yet to trigger this from (see `CMS.md`), so this route exists but has no UI caller today.
