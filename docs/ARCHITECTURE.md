# Architecture

## Stack (existing, kept)

- **Frontend**: Angular 22, standalone components + signals (no NgModules), Angular Material 22 + SCSS (M3 theming, custom palette rather than Material defaults — see `UI-UX.md`), Vitest for unit tests, Prettier for formatting. Hosted on Vercel.
- **Backend**: Node 22, TypeScript (strict), Express app running inside a single Firebase Cloud Function (`api`), mounted at `/api/v1`. Requires the Firebase Blaze (pay-as-you-go) plan to deploy.
- **Database**: Firestore, in the `homestay-cms` Firebase project.
- **Auth**: Firebase Auth (admin accounts only).
- **Media storage**: Cloudinary (not Firebase Storage — see decision below).
- **Payments**: Billplz (not Stripe — see `PAYMENT.md` for the decision and comparison).
- **Email**: SendGrid.

## Why Express-on-Cloud-Functions (kept from the existing scaffold)

Already working, already deployed to the `homestay-cms` Firebase project, and gives one Express app (familiar routing/middleware model) instead of many discrete `onCall`/`onRequest` functions. No reason to change it.

## Authorization model

> **Decision:** Firestore security rules are deny-all (`allow read, write: if false` on every document). All reads and writes go through the Cloud Functions API using the Admin SDK.
> **Reason:** Centralizing all authorization logic in one place (Express middleware) is easier to reason about and test than duplicating rules in both Firestore security rules and application code, especially for the booking-transaction logic that must be atomic (see `DATABASE.md`).
> **Impact:** Every mutation must go through a Cloud Function endpoint. The frontend never talks to Firestore directly, only Firebase Auth (for the admin login) and the REST API.

Admin routes require: a valid Firebase Auth ID token, verified server-side, carrying a custom claim `role: admin`. Admin accounts are provisioned out-of-band (a one-time Admin SDK script), not through a public registration endpoint — there is no guest or host registration.

## Backend structure

```
functions/src/
  index.ts                 exports `api` only — a thin wrapper around app.ts
  app.ts                   ✅ Express app assembly: cors, json body parsing, route mounting, error handler
  config/                  firebase.ts (existing), env.ts (planned)
  types/                   ✅ accommodation, booking, payment, media, site-settings
  utils/                   ✅ app-error.ts — AppError(statusCode, message, code)
  middleware/              ✅ auth.middleware (requireAdmin), validate.middleware (zod), error.middleware
                            ⏳ rateLimit.middleware — planned, not yet built
  services/                ✅ pricing.service (calculatePrice, enumerateNightsForRange)
                            ✅ booking.service (createBooking, getAvailability, expireStalePendingBookings)
                            ⏳ payment.service, email.service, media.service — planned
  routes/
    health.routes.ts          ✅ GET /health (existing)
    admin/auth.routes.ts       ✅ GET /admin/me — requireAdmin-protected, the first proof the auth
                                wiring works end-to-end over real HTTP with a real Firebase Auth token
    admin/accommodation.routes.ts ✅ full CRUD, requireAdmin + zod-validated
    admin/media.routes.ts      ✅ sign-upload + record/list/update/delete, requireAdmin + zod-validated
    (everything else)         ⏳ planned — content/availability/bookings/payment routes
  validation/                 ✅ accommodation.schema.ts, media.schema.ts (zod)
  controllers/                — not introduced; routes call services directly, since each route is a
                                thin one-liner and an extra layer would just be indirection with no
                                behavior of its own (revisit if a route needs real pre/post-processing)
```

Business logic (the booking transaction, pricing calculation, payment verification, accommodation/media CRUD) lives in `services/`, never in routes or the frontend.

There is no public registration endpoint. Admin accounts are created with `functions/scripts/create-admin.js` (a standalone script using the Admin SDK, not deployed as a Cloud Function) — see `DEVELOPMENT.md` for usage.

Media storage: Cloudinary, configured via `functions/src/config/env.ts` (throws a clear "missing env var" error if read before `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` are set, rather than failing silently or crashing unrelated routes at cold start).

Verification for this layer: `functions/src/**/__tests__/*.test.ts`, run via `npm test` (see `DEVELOPMENT.md`) — 42 tests covering pricing rules, the booking transaction (including a concurrency test asserting exactly one of two simultaneous overlapping bookings succeeds), booking expiry, all three middleware, an integration test hitting `GET /admin/me` over real HTTP with tokens signed by the Auth emulator, accommodation CRUD (including the slug-uniqueness and delete-with-bookings guards) against the Firestore emulator, and media service logic against a mocked Cloudinary SDK (no real Cloudinary account needed to verify the signing/record/update/delete logic — only actually uploading a file needs real credentials).

## Frontend structure

```
src/app/
  public/     ⏳ planned — home, accommodation (list+detail), gallery, about, faq, contact,
              booking (stepper), booking-lookup, not-found
  admin/
    login/       ✅ email/password form, generic error message (never reveals which field was wrong)
    dashboard/    ✅ shell — shows the signed-in admin's email, calls GET /admin/me to prove
                  the frontend-to-backend auth chain actually works, and links to the pages below
    accommodation/ ✅ list + a dialog-based create/edit form (accommodation-form-dialog/), including
                    inline photo upload straight into the accommodation's own `photos` array
    media/        ✅ gallery manager — upload, inline alt-text editing, delete
    (everything else) ⏳ planned — site content, availability, bookings, settings
  shared/
    services/    ✅ auth.service.ts (wraps Firebase Auth), api.service.ts (HttpClient wrapper),
                  accommodation.service.ts, media.service.ts (signs + uploads straight to
                  Cloudinary via fetch — deliberately bypasses HttpClient/auth.interceptor so the
                  Firebase ID token is never sent to a third-party host)
    guards/      ✅ admin.guard.ts (CanActivateFn — redirects to /admin/login if not an admin)
    interceptors/ ✅ auth.interceptor.ts (attaches the ID token, but only to requests aimed at
                  environment.apiUrl — never to third-party requests like a maps API)
    models/      ⏳ planned
  core/       firebase.config.ts (existing), seo.service.ts (planned — meta tags + structured data)
```

The scaffolded `auth/register`, `host/*`, `guest/*` folders (and the marketplace-shaped `admin/manage-users`, `admin/manage-reports`) were deleted — they were empty and belonged to the superseded marketplace model (see `PROJECT-OVERVIEW.md`). The default Angular CLI splash page in `app.html`/`app.ts` was also replaced with a plain `<router-outlet />` now that real routes exist.

`admin.guard` checks `role: admin` off the current Firebase ID token's claims client-side (no round trip needed to gate navigation); `GET /admin/me` independently re-verifies the same token server-side, so a stale or tampered client-side check can never grant real API access.

## Media storage decision

> **Decision:** Use Cloudinary for all media (photos/video), not Firebase Storage.
> **Reason:** Cloudinary's free tier includes on-the-fly transformation — resize, WebP/AVIF conversion, compression, responsive `srcset` generation — which directly satisfies the image-optimization requirements without hand-rolled processing code. Firebase Storage only stores raw files.
> **Impact:** Uploads go through a backend-signed-upload endpoint (the Cloudinary API secret never reaches the browser); the backend validates file type/size/dimensions before issuing the signature. Deleting a media item removes it from Cloudinary via the Admin API, not just the Firestore reference.

## Email

SendGrid, called through an `email.service` interface so the provider can be swapped later without touching call sites. Emails sent: booking confirmation, payment confirmation, cancellation, admin new-booking notification.
