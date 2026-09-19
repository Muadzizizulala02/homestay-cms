# Changelog

## 2026-09-19 — Fix: local admin login was broken (emulator wiring + project ID mismatch)

Reported by the user immediately after Phase 3: `npm run create-admin -- --emulator` succeeded, but the login page still couldn't sign in.

Two bugs, both leftover from the original scaffold's unfilled placeholders:
1. `core/firebase.config.ts` never called `connectAuthEmulator()` — the frontend was trying to reach real Firebase Auth servers with a fake API key instead of the local emulator.
2. `create-admin.js --emulator` defaulted `GCLOUD_PROJECT` to `demo-test` (the automated test suite's throwaway project), but an interactively-run `firebase emulators:start` serves `.firebaserc`'s default project, `homestay-cms` — so the admin user was provisioned into a different emulator project than the one the browser/frontend actually talks to.

Fixes:
- `core/firebase.config.ts` now calls `connectAuthEmulator()` whenever `!environment.production` (i.e. always under `ng serve`).
- `environment.development.ts`'s placeholder Firebase config (`your-project`, `YOUR_API_KEY`, etc.) replaced with values consistent with the local emulator (`projectId: 'homestay-cms'` — the only field emulator connections actually key off of — plus a correct `apiUrl` pointing at the functions emulator under the same project).
- `create-admin.js --emulator` now defaults to `homestay-cms` (matching `.firebaserc`) instead of `demo-test`, with an optional `--project=` override for anyone running emulators under a different id.

**Action needed once**: re-run `npm run create-admin -- --email=... --password=... --emulator` in `functions/` (idempotent — finds the existing user by email if already created) so the admin account exists under the correct project, then restart `ng serve` to pick up the environment file change.

## 2026-09-19 — Phase 3: admin auth + CMS skeleton

- Split `functions/src/app.ts` (Express app assembly) out of `index.ts` (now just the Cloud Functions wrapper), as planned in `ARCHITECTURE.md`.
- Added the first real protected route, `GET /api/v1/admin/me` (`functions/src/routes/admin/auth.routes.ts`), using `requireAdmin` from Phase 2. Confirms the whole auth chain works over real HTTP, not just in mocked unit tests.
- Added `functions/scripts/create-admin.js` — a standalone Admin SDK script (not deployed) that creates/updates a Firebase Auth user and grants the `role: admin` custom claim. There is still no public registration endpoint by design.
- Added the Auth emulator to `firebase.json` (port 9099) and a `src/test/auth-emulator.ts` test helper that signs in against it to obtain genuine ID tokens for integration testing — `admin/auth.routes.ts` is now covered by an HTTP-level test (`supertest`) exercising the no-token / non-admin-token / admin-token cases against the real Firebase Auth emulator, not a mock.
- **Frontend**: removed the empty marketplace-shaped scaffold folders (`auth/register`, `host/*`, `guest/*`, `admin/manage-users`, `admin/manage-reports`) and replaced the default Angular CLI splash page (`app.html`/`app.ts`) with a plain router outlet. Added `shared/services/auth.service.ts` (Firebase Auth wrapper exposing `isAdmin` from ID token claims), `shared/services/api.service.ts` (backend API wrapper), `shared/guards/admin.guard.ts` (route guard), a real `auth.interceptor.ts` (attaches the ID token only to requests aimed at our own API), and the first two admin pages: `admin/login/` and `admin/dashboard/` (the dashboard calls `GET /admin/me` on load to verify the backend session, not just that Firebase sign-in succeeded).
- Updated `app.routes.ts`: `/admin/login`, `/admin/dashboard` (guarded), and a temporary `''  → /admin/login` redirect until the real homepage exists (Phase 5).
- Verified: `npm run build` (functions, tsc) and `npm test` (functions, 28 tests against the Firestore + Auth emulators) both pass; `ng build` and `ng test` (frontend, 3 tests) both pass.
- Updated `ARCHITECTURE.md`, `DEVELOPMENT.md`, `PROJECT-OVERVIEW.md` to match.

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
