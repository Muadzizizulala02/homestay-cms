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
  index.ts                 exports `api` only (unchanged — no new routes wired yet)
  config/                  firebase.ts (existing), env.ts (planned)
  types/                   ✅ accommodation, booking, payment, media, site-settings
  utils/                   ✅ app-error.ts — AppError(statusCode, message, code)
  middleware/              ✅ auth.middleware (requireAdmin), validate.middleware (zod), error.middleware
                            ⏳ rateLimit.middleware — planned, not yet built
  services/                ✅ pricing.service (calculatePrice, enumerateNightsForRange)
                            ✅ booking.service (createBooking, getAvailability, expireStalePendingBookings)
                            ⏳ payment.service, email.service, media.service — planned
  routes/, controllers/    ⏳ planned — not built yet, so middleware above isn't wired into
                            the Express app (app.ts) or index.ts until a route needs it
```

Business logic (the booking transaction, pricing calculation, payment verification) lives in `services/`, never in controllers, routes, or the frontend. The planned `app.ts` split (assembling the Express app separately from `index.ts`) happens when the first real route is added, rather than as an empty scaffold now.

Verification for this layer: `functions/src/**/__tests__/*.test.ts`, run via `npm test` (see `DEVELOPMENT.md`) — 24 tests covering pricing rules, the booking transaction (including a concurrency test asserting exactly one of two simultaneous overlapping bookings succeeds), booking expiry, and all three middleware.

## Frontend structure (planned)

```
src/app/
  public/     home, accommodation (list+detail), gallery, about, faq, contact,
              booking (stepper), booking-lookup, not-found
  admin/      login, dashboard, content, media, accommodation, availability, bookings, settings
  shared/     services (api.service, auth.service), guards (admin.guard),
              interceptors (existing auth.interceptor), models, ui (reusable components)
  core/       firebase.config.ts (existing), seo.service.ts (meta tags + structured data per route)
```

The scaffolded `auth/register`, `host/*`, `guest/*` folders are removed — they were empty and belonged to the superseded marketplace model (see `PROJECT-OVERVIEW.md`).

## Media storage decision

> **Decision:** Use Cloudinary for all media (photos/video), not Firebase Storage.
> **Reason:** Cloudinary's free tier includes on-the-fly transformation — resize, WebP/AVIF conversion, compression, responsive `srcset` generation — which directly satisfies the image-optimization requirements without hand-rolled processing code. Firebase Storage only stores raw files.
> **Impact:** Uploads go through a backend-signed-upload endpoint (the Cloudinary API secret never reaches the browser); the backend validates file type/size/dimensions before issuing the signature. Deleting a media item removes it from Cloudinary via the Admin API, not just the Firestore reference.

## Email

SendGrid, called through an `email.service` interface so the provider can be swapped later without touching call sites. Emails sent: booking confirmation, payment confirmation, cancellation, admin new-booking notification.
