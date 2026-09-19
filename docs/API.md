# API

Status: everything below is implemented (✅) except manual availability-blocking and the admin bookings list/detail/status screen (⏳ — no UI exists yet to call them from).

All endpoints are mounted under `/api/v1` on the single `api` Cloud Function (Express), assembled in `functions/src/app.ts`. Admin endpoints require a Firebase Auth ID token with a `role: admin` custom claim.

## Public (no auth) — `functions/src/routes/public.routes.ts`

- ✅ `GET /health`
- ✅ `GET /site-settings` — site content for the public pages (never 404s — returns built-in defaults if never saved)
- ✅ `GET /accommodations` — list **active** accommodations only
- ✅ `GET /accommodations/:slug` — single accommodation detail; 404s for an unknown OR inactive slug (an inactive unit reads as "not found" to a guest, not as an authorization error)
- ✅ `GET /gallery` — media items tagged `association.type === 'gallery'`, ordered
- ✅ `GET /accommodations/:id/availability?from=&to=` — takes the accommodation's Firestore doc `id` (not its slug), returns only the dates in range that are already `booked`/`blocked`
- ✅ `POST /bookings` — validated by `createBookingSchema`; runs the transactional availability check (`booking.service.createBooking`), returns a `pending_payment` booking with server-computed pricing
- ✅ `POST /bookings/:id/payment` — creates (or reuses) a Billplz bill for a `pending_payment` booking, returns `{ redirectUrl }`. A separate call from booking creation on purpose — see `PAYMENT.md`.
- ✅ `GET /bookings/lookup?reference=&email=` — guest-facing status check, no account; requires the matching email specifically so a reference alone (short, somewhat guessable) can't be used to view someone else's booking
- ✅ `POST /payments/webhook/billplz` — Billplz's server-to-server callback (form-encoded body, not JSON). Signature-verified inside the handler, not by middleware — there's no bearer token or session to check before the handler runs.

## Admin (auth required — `requireAdmin` on every route below)

- ✅ `GET /admin/me` — verifies the token, returns `{ uid, email }`
- ✅ `GET /admin/accommodations` — list all (including inactive)
- ✅ `GET /admin/accommodations/:id`
- ✅ `POST /admin/accommodations` — body validated against `createAccommodationSchema`
- ✅ `PUT /admin/accommodations/:id` — partial update, validated against `updateAccommodationSchema`
- ✅ `DELETE /admin/accommodations/:id` — 409 `ACCOMMODATION_HAS_BOOKINGS` if any booking references it
- ✅ `POST /admin/media/sign-upload` — body `{ folder? }`, returns a Cloudinary-signed upload payload; the client uploads directly to Cloudinary with it
- ✅ `GET /admin/media` — list, ordered by `order`
- ✅ `POST /admin/media` — records a media item after a successful Cloudinary upload
- ✅ `PUT /admin/media/:id` — update `altText`/`order`/`association`
- ✅ `DELETE /admin/media/:id` — destroys the Cloudinary asset, then the Firestore doc
- ✅ `GET /admin/site-settings` — same data as the public route, but requires auth (used to prefill the admin editor)
- ✅ `PUT /admin/site-settings` — partial update, validated against `updateSiteSettingsSchema`; array fields (`houseRules`, `faqs`, `socialLinks`) are replaced wholesale, not merged element-by-element
- ✅ `POST /admin/bookings/:id/refund` — records the payment as `refunded` and cancels the booking; does **not** call Billplz (no refund API exists — see `PAYMENT.md`), so the admin must process the actual refund in the Billplz dashboard first. No admin UI calls this yet.
- ⏳ `PUT /admin/accommodations/:id/availability` — manually block/unblock dates
- ⏳ `GET /admin/bookings`, `GET /admin/bookings/:id`, `PUT /admin/bookings/:id/status` — the admin bookings list/detail/status screen

Every implemented route's request/response shape is defined by its Zod schema (`functions/src/validation/`) and its service's TypeScript types (`functions/src/services/`, `functions/src/types/`) — read those directly rather than duplicating the shapes here, since they're the enforced source of truth and this doc would drift.
