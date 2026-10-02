# Payment

Status: implemented — bill creation, webhook verification, and a (dashboard-manual) refund recording action are all live, on ToyyibPay. The Stripe SDK dependencies from the original scaffold were already removed in Phase 2.

## Gateway decision

> **Decision (revised 2026-09-19): switch from Billplz to ToyyibPay.**
> **Reason:** Billplz requires a registered company (SSM) to open even a sandbox-adjacent real account. ToyyibPay explicitly supports individual/personal registration with no SSM requirement, via a personal bank account under the Dewan Ekonomi GIG Malaysia (DEGM) structure — confirmed directly against their registration requirements. That's a hard blocker Billplz doesn't have a workaround for, so it outweighs Billplz's marginally cheaper FPX fee and stronger (HMAC-SHA256 vs. MD5) webhook signature.
> **Impact:** `payment.service.ts` rewritten against ToyyibPay's API; the original Billplz research and comparison is preserved below since the trade-offs are still relevant if the company-registration blocker ever goes away.

| | ToyyibPay (chosen) | Billplz | Stripe | Curlec |
|---|---|---|---|---|
| Individual/no-company signup | ✅ Yes (DEGM personal account) | ❌ Requires SSM | ❌ Requires a registered business | Unconfirmed |
| MY support | Native | Native | Officially launched, FPX+cards, no DuitNow/local e-wallets | Native, BNM-regulated, PayNet member |
| Setup/annual fee | RM0 setup, RM100/year from year 2 | RM0 (Basic) | RM0 | RM0 (Basic) / RM999 (Premium) |
| FPX fee | RM1 flat (B2C) | RM0.75–1.25 flat | 3% + RM1 | 1–1.5% or RM1 |
| Cards | via billPaymentChannel, fee unconfirmed | 2.5%, min RM0.65 | 3% + RM1 (+1% intl) | 2.0–2.4% |
| Settlement | 4 business days | Next business day | 7-day rolling | Not confirmed |
| Webhook auth | MD5 hash (secret key + fields) | HMAC-SHA256 (separate X-Signature key) | — | — |
| Independent status check | ✅ `getBillTransactions` API | Not confirmed | — | — |

FPX is still the dominant online payment method in Malaysia and this remains a low-volume, moderate-value use case, so the ~25 sen/transaction difference between the two is immaterial next to the individual-signup requirement.

## Server-side verification (non-negotiable)

> **Decision:** The frontend never marks a booking as paid. Payment status only changes to `paid` after the backend independently verifies a ToyyibPay callback.
> **Reason:** Any value coming from the browser (including a redirect query parameter claiming success) can be manipulated by the client. Only a verified server-to-server signal is trustworthy.
> **Impact:** Payment status must only become `paid` after verified gateway confirmation, never from a frontend event.

Flow (all ✅ implemented in `functions/src/services/payment.service.ts`):
1. `createPaymentForBooking(bookingId)` creates a ToyyibPay bill via `POST {TOYYIBPAY_BASE_URL}/index.php/api/createBill` (secret key + category code sent in the form body — ToyyibPay doesn't use HTTP Basic Auth like Billplz; amount in cents), tied to a `pending_payment` booking. Called from `POST /bookings/:id/payment` — deliberately a separate call from booking creation itself, never inside the booking transaction, since an external HTTP call inside a retryable Firestore transaction risks creating duplicate bills if the transaction retries. If a `pending` payment already exists for the booking (e.g. the guest reloaded the page), the existing bill is reused rather than creating a second one. ToyyibPay's response is a JSON *array* (`[{ "BillCode": "..." }]`), not an object — easy to get wrong.
2. Guest is redirected to ToyyibPay's hosted payment page, constructed as `{TOYYIBPAY_BASE_URL}/{BillCode}`.
3. On completion, ToyyibPay calls our webhook: `POST /api/v1/payments/webhook/toyyibpay` (form-encoded, not JSON — `app.ts` registers `express.urlencoded()` for this).
4. `verifyToyyibPaySignature()` recomputes the callback hash: `MD5(secretKey + status + order_id + refno + "ok")` (note the literal `"ok"` suffix — confirmed against two independent sources since it's an unusual detail easy to mistype), compared to the provided `hash` with `crypto.timingSafeEqual` — the payload is rejected (401) if it doesn't match. This is a weaker algorithm than Billplz's HMAC-SHA256 (MD5 is old and collision-prone) but is still a real check tied to a secret only we and ToyyibPay know.
5. Only after hash verification does a Firestore transaction flip `payments/{id}.status` to `paid` (`status === '1'`) or `failed` (anything else) and, on success, `bookings/{id}.status` to `confirmed`.
6. The browser's redirect back to our site (`billReturnUrl`, pointed at `/booking/confirmation?reference=...`) is UX only — nothing there is trusted; only the webhook can ever move a payment to `paid`. (ToyyibPay's return-URL redirect carries different, unsigned fields than the callback — another reason not to trust it.)

**Local testing note**: ToyyibPay cannot reach `localhost`. Testing the webhook end-to-end locally needs a public tunnel (e.g. `ngrok http 5001`) with `API_BASE_URL` pointed at the tunnel URL — not something this environment has been able to exercise; verified instead via `payment.service.test.ts` with a mocked `fetch` and a locally-computed valid hash.

## Refunds

> **No confirmed refund API.** ToyyibPay's Terms of Service describe a refund as a merchant-initiated *instruction* that ToyyibPay "may decline to act upon," not a documented API call — consistent with what was found for Billplz (dashboard/support-only, no public refund endpoint on either gateway).
> **Impact:** `markPaymentRefunded(bookingId)` (admin-only, `POST /admin/bookings/:id/refund`) does not move any money — it only updates our own `payments/{id}.status` to `refunded` and cancels the booking, and only after the admin has processed the actual refund through ToyyibPay themselves. There is no admin bookings screen yet to trigger this from (see `CMS.md`), so this route exists but has no UI caller today.
