# Homestay CMS (Muadz & Arif)

Property booking platform (Angular + Firebase). See [HOMESTAY_CMS_PROJECT_PLAN.md](./HOMESTAY_CMS_PROJECT_PLAN.md) for the full project plan.

## Prerequisites

- Node.js (via `nvm`), Angular CLI, Firebase CLI — see setup notes in the project plan.
- A JRE on `PATH` (for the Firestore emulator).

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

Run the local emulators from the repo root (uses `firebase.json`):

```bash
firebase emulators:start --only functions,firestore
# Functions:  http://127.0.0.1:5001/homestay-cms/us-central1/api
# Firestore:  http://127.0.0.1:8080
# Emulator UI: http://127.0.0.1:4000
```

## Deploy

```bash
# Functions + Firestore rules
firebase deploy --only functions,firestore

# Frontend
cd homestay-cms-frontend && vercel --prod
```

Deploying Functions requires the Firebase project to be on the **Blaze** (pay-as-you-go) plan — see the Firebase console.
