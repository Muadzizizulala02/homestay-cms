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
firebase emulators:start --only functions,firestore
# Functions:   http://127.0.0.1:5001/homestay-cms/us-central1/api
# Firestore:   http://127.0.0.1:8080
# Emulator UI: http://127.0.0.1:4000
```

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
npm test   # firebase emulators:exec --only firestore --project demo-test "vitest run"
```

This spins up a real (local) Firestore emulator under a throwaway `demo-test` project ID — never the real `homestay-cms` project — runs the Vitest suite against it, then tears it down. `src/test/emulator-setup.ts` points the Admin SDK at the emulator via `FIRESTORE_EMULATOR_HOST`/`GCLOUD_PROJECT`. Currently covers: `pricing.service` (rate rules, min/max stay), `booking.service` (the transactional booking-creation flow, including a concurrency test that fires two overlapping bookings simultaneously and asserts exactly one succeeds, plus hold-expiry), and all three middleware (`auth`, `validate`, `error`) via mocked req/res — no emulator needed for those. As routes/controllers are added, add integration tests for them here too (e.g. the Billplz webhook handler with valid/invalid signatures).

### Frontend (`homestay-cms-frontend/`)

```bash
ng test
```

Vitest component tests — to be added alongside each component (e.g. the booking stepper's validation logic).

### Manual

Full guest journey (search → book → pay via Billplz sandbox → confirmation email) and admin journey (login → edit content → add room → block dates → view booking → mark refunded) against the emulator suite before calling a phase done.
