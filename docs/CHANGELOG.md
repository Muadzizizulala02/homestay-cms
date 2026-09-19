# Changelog

## 2026-09-19 — Phase 2: backend data layer (types, booking service, pricing, middleware)

- Added Firestore TypeScript types: `functions/src/types/{accommodation,booking,payment,media,site-settings}.types.ts`.
- Added `pricing.service.ts` (`calculatePrice`, `enumerateNightsForRange`) — server-side-only price calculation with weekday/seasonal rate overrides and min/max-stay enforcement.
- Added `booking.service.ts` (`createBooking`, `getAvailability`, `expireStalePendingBookings`) — the transaction-based double-booking-prevention logic described in `DATABASE.md`. `expireStalePendingBookings` is implemented and tested but not yet wired to a scheduled trigger (deferred to the phase where the booking flow goes live end-to-end).
- Added `auth.middleware.ts` (`requireAdmin` — Firebase ID token + `role: admin` claim check), `validate.middleware.ts` (Zod-based request validation), `error.middleware.ts` (structured error responses via a new `AppError` class in `utils/app-error.ts`). None of these are wired into `index.ts`/`app.ts` yet — no route exists to use them yet, so wiring happens when the first real route is added.
- Added a Vitest setup for `functions/` (new `devDependency`), running against the local Firestore emulator under a throwaway `demo-test` project ID (`npm test` in `functions/`). 24 tests pass, including a concurrency test that fires two simultaneous overlapping `createBooking()` calls and asserts exactly one succeeds — the core guarantee the whole booking system depends on.
- Added the `bookings` `status`+`holdExpiresAt` composite index to `firestore.indexes.json`, required by `expireStalePendingBookings`.
- Removed the `stripe`/`@stripe/stripe-js` dependencies and `STRIPE_SECRET_KEY`/`STRIPE_PUBLIC_KEY`/`stripePublicKey` references left over from the superseded plan (both `package.json`s, both `.env.example`s, both `environment*.ts` files) — Billplz was already the confirmed decision from the previous planning session; this just removes the now-dead code path. Verified with `npm run build` (functions, tsc) and `ng build` (frontend) after removal.
- Added `*serviceAccount*.json`/`*firebase-adminsdk*.json` to `.gitignore` as a safety net.
- Updated `ARCHITECTURE.md`, `DATABASE.md`, `DEPLOYMENT.md`, `DEVELOPMENT.md`, `PROJECT-OVERVIEW.md` to reflect the above.

## 2026-09-19 — Planning: single-homestay CMS scope, Billplz payment decision, /docs created

- Superseded the original multi-host-marketplace plan (`HOMESTAY_CMS_PROJECT_PLAN.md`) with a single-homestay CMS scope: admin-only auth, no guest accounts, no host role. Full reasoning in `PROJECT-OVERVIEW.md`.
- Compared Billplz, Stripe, and Curlec for the Malaysian market; chose **Billplz** for FPX cost efficiency (confirmed with product owner). Details in `PAYMENT.md`.
- Designed the Firestore data model and the transaction-based double-booking prevention mechanism (per-night availability documents). Details in `DATABASE.md`.
- Designed the public page structure (6 indexable pages + non-indexed booking flow), merging About+Location and FAQ+House Rules to avoid thin-content pages. Details in `SEO.md`.
- Created this `/docs` directory, seeded from the approved planning document.
- No application code changed in this entry — planning and documentation only. The pre-existing skeleton (Angular app shell, single `/health` Cloud Function, deny-all Firestore rules) is unchanged.

## (prior, from git history) Initial scaffold

- `f4a78ad` — Initial commit: project plan (`HOMESTAY_CMS_PROJECT_PLAN.md`, now superseded) and `.gitignore`.
- `6b77c9c` — Scaffolded the Angular frontend (standalone components, Material, empty route table) and Firebase Functions backend (Express app with a single `/health` route, deny-all Firestore rules, Admin SDK config).
