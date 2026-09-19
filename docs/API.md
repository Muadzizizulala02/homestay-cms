# API

Status: planned. Only `GET /api/v1/health` currently exists.

All endpoints are mounted under `/api/v1` on the single `api` Cloud Function (Express). Admin endpoints require a Firebase Auth ID token with a `role: admin` custom claim.

## Public (no auth)

- `GET /site-settings` — site content for the public pages
- `GET /accommodations` — list active accommodations
- `GET /accommodations/:slug` — single accommodation detail
- `GET /accommodations/:id/availability?from=&to=` — availability for a date range
- `POST /bookings` — create a booking (runs the availability transaction, returns a `pending_payment` booking + Billplz redirect URL)
- `GET /bookings/lookup?reference=&email=` — guest-facing status check, no account
- `POST /payments/webhook/billplz` — Billplz webhook (signature-verified, not guest-facing)

## Admin (auth required)

- `PUT /admin/site-settings` — update site content
- `POST /admin/accommodations`, `PUT /admin/accommodations/:id`, `DELETE /admin/accommodations/:id`
- `POST /admin/media/sign-upload`, `DELETE /admin/media/:id`
- `PUT /admin/accommodations/:id/availability` — manually block/unblock dates
- `GET /admin/bookings` — filterable/searchable list
- `GET /admin/bookings/:id`
- `PUT /admin/bookings/:id/status` — manual status override
- `POST /admin/bookings/:id/refund` — trigger a Billplz refund

Request/response schemas will be documented here as each route is implemented, alongside the Zod validation schema it uses.
