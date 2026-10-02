# Development

## Prerequisites

- Node.js (via `nvm`), Angular CLI, Firebase CLI
- A JRE on `PATH` (for the Firestore emulator)

## Frontend (`homestay-cms-frontend/`)

```bash
cd homestay-cms-frontend
npm install
ng serve          # http://localhost:4200
```

## Backend (`functions/`)

```bash
cd functions
npm install
npm run build
```

## Local emulators (from repo root)

```bash
firebase emulators:start --only functions,firestore,auth --export-on-exit=./emulator-data --import=./emulator-data
# Functions:   http://127.0.0.1:5001/homestay-cms/us-central1/api
# Firestore:   http://127.0.0.1:8080
# Auth:        http://127.0.0.1:9099
# Emulator UI: http://127.0.0.1:4000
```

`--export-on-exit`/`--import` persist Firestore and Auth data across restarts into the gitignored `emulator-data/` (the directory itself is tracked via `.gitkeep` so `--import` doesn't fail on a fresh clone — it's fine when empty). Drop both flags for a clean-slate emulator each time instead. See `DEV-MODE.md` for the full walkthrough, including how this interacts with `npm run serve`.

## Creating an admin account

There is no public registration endpoint — admins are provisioned with a standalone script:

```bash
cd functions
npm run create-admin -- --email=owner@example.com --password=... --emulator   # against the local emulators
npm run create-admin -- --email=owner@example.com --password=...              # against production (needs GOOGLE_APPLICATION_CREDENTIALS or `gcloud auth application-default login`)
```

It creates the Firebase Auth user if needed and sets the `role: admin` custom claim `functions/src/middleware/auth.middleware.ts` checks for.

## Conventions

- Business logic lives in `functions/src/services/`, never in controllers, routes, or frontend components.
- Frontend business logic lives in `shared/services`; components stay presentational where practical.
- New Firestore document shapes get a matching TypeScript interface in `functions/src/types/` and (if the frontend also reads it) `src/app/shared/models/`.
- Zod validates every request body before it reaches a controller.
- Run `npm run build` in `functions/` and `ng test`/`ng build` in the frontend before considering a phase done.

## Testing

### Backend (`functions/`)

```bash
cd functions
npm test   # firebase emulators:exec --only firestore,auth --project demo-test "vitest run"
```

This spins up real (local) Firestore + Auth emulators under a throwaway `demo-test` project ID — never the real `homestay-cms` project — runs the Vitest suite against them, then tears them down. `src/test/emulator-setup.ts` points the Admin SDK at the emulator via `FIRESTORE_EMULATOR_HOST`/`GCLOUD_PROJECT`. Currently covers: `pricing.service` (rate rules, min/max stay), `booking.service` (the transactional booking-creation flow, including a concurrency test that fires two overlapping bookings simultaneously and asserts exactly one succeeds, plus hold-expiry), all three middleware (`auth`, `validate`, `error`) via mocked req/res, and an integration test for `GET /admin/me` that signs in against the real Auth emulator (via `src/test/auth-emulator.ts`, which hits the emulator's REST sign-in endpoint to get a genuine ID token — `verifyIdToken()` can't be exercised meaningfully with a mock) to prove the whole token-verification chain actually works, not just that it's mocked correctly. As more routes are added, add integration tests for them here too (`payment.service.test.ts` already covers the ToyyibPay webhook handler with valid/invalid hashes, via a mocked `fetch`).

If a test run is interrupted (e.g. killed mid-suite), a stray Firestore/Auth emulator process can be left holding ports 8080/9099 — `lsof -i :8080` (or `:9099`) to find and kill it before the next run.

**Sanity-check new routes with `curl` against the real running emulator, not just `npm test`.** `admin/auth.routes.test.ts` talks to the Express `app` object directly via `supertest`, which bypasses the Cloud Functions URL-routing layer entirely — it can pass while the route is completely unreachable by any real caller (this happened: every route was mounted at the wrong internal path for months of phases before a manual test caught it — see `CHANGELOG.md`, "Fix: every API route was unreachable"). After adding a route, hit it for real:

```bash
curl http://127.0.0.1:5001/homestay-cms/us-central1/api/v1/health
curl -H "Authorization: Bearer <a real ID token>" http://127.0.0.1:5001/homestay-cms/us-central1/api/v1/admin/me
```

A plain HTML "Cannot GET /..." (not our JSON `{"error": {...}}` shape) means the route never matched inside Express — check `app.ts`'s mount path, remembering Express only ever sees `/v1/...`, never `/api/v1/...` (the `api` is the Cloud Function's own name, stripped before Express gets the request).

### Frontend (`homestay-cms-frontend/`)

```bash
ng test
```

Vitest component tests — to be added alongside each component (e.g. the booking stepper's validation logic).

### Manual

Full guest journey (search → book → pay via ToyyibPay sandbox → confirmation email) and admin journey (login → edit content → add room → block dates → view booking → mark refunded) against the emulator suite before calling a phase done.
