# API

Status: health check, admin auth check, and accommodation/media CRUD are implemented (✅ below). Everything else is planned (⏳).

All endpoints are mounted under `/api/v1` on the single `api` Cloud Function (Express). Admin endpoints require a Firebase Auth ID token with a `role: admin` custom claim.

## Public (no auth)

- ✅ `GET /health`
- ⏳ `GET /site-settings` — site content for the public pages
- ⏳ `GET /accommodations` — list active accommodations
- ⏳ `GET /accommodations/:slug` — single accommodation detail
- ⏳ `GET /accommodations/:id/availability?from=&to=` — availability for a date range
- ⏳ `POST /bookings` — create a booking (runs the availability transaction, returns a `pending_payment` booking + Billplz redirect URL)
- ⏳ `GET /bookings/lookup?reference=&email=` — guest-facing status check, no account
- ⏳ `POST /payments/webhook/billplz` — Billplz webhook (signature-verified, not guest-facing)

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
- ⏳ `PUT /admin/site-settings`
- ⏳ `PUT /admin/accommodations/:id/availability` — manually block/unblock dates
- ⏳ `GET /admin/bookings`, `GET /admin/bookings/:id`, `PUT /admin/bookings/:id/status`, `POST /admin/bookings/:id/refund`

Every implemented route's request/response shape is defined by its Zod schema (`functions/src/validation/`) and its service's TypeScript types (`functions/src/services/`, `functions/src/types/`) — read those directly rather than duplicating the shapes here, since they're the enforced source of truth and this doc would drift.
