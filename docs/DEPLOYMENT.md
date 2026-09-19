# Deployment

## Hosting split

- Frontend: Vercel
- Backend (Cloud Functions + Firestore): Firebase, project `homestay-cms`, **requires the Blaze (pay-as-you-go) plan**

## Deploy commands

```bash
# Functions + Firestore rules
firebase deploy --only functions,firestore

# Frontend
cd homestay-cms-frontend && vercel --prod
```

## Environment variables (see each project's `.env.example`)

**Frontend** (`homestay-cms-frontend/.env.example`): Firebase web config keys, API base URL, Cloudinary cloud name (public). Billplz is entirely server-only — no Billplz keys ever reach the frontend; it only ever receives the `redirectUrl` the backend returns.

**Backend** (`functions/.env.example`): `FIREBASE_PROJECT_ID`, `SENDGRID_API_KEY`; `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` (media uploads); `BILLPLZ_SECRET_KEY`/`BILLPLZ_COLLECTION_ID`/`BILLPLZ_X_SIGNATURE_KEY`/`BILLPLZ_BASE_URL` (payments — use the sandbox values and `https://www.billplz-sandbox.com` while testing, switch to production values + `https://www.billplz.com` to go live); `FRONTEND_BASE_URL`/`API_BASE_URL` (the public origins Billplz redirects to / calls back — **cannot be `localhost`**, since Billplz can't reach your machine directly; local webhook testing needs a tunnel, e.g. `ngrok http 5001`, with `API_BASE_URL` pointed at the tunnel). `functions/src/config/env.ts` throws a clear error naming the missing variable if any of these is read before being set, rather than failing silently.

None of these are committed; only `.env.example` placeholder files are tracked.

## Known gaps to close before a real deploy

- No CI/CD pipeline yet (no `.github/workflows`).
- No Storage rules/config exist (expected — media goes through Cloudinary, not Firebase Storage; see `ARCHITECTURE.md`).
- The Billplz webhook has never been exercised against the real gateway in this environment (no tunnel set up, no real sandbox credentials) — verified instead via `payment.service.test.ts` with a mocked `fetch` and a locally-computed valid signature. Test it for real with a tunnel before taking payments live.
