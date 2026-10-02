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

**Frontend** (`homestay-cms-frontend/.env.example`): Firebase web config keys, API base URL, Cloudinary cloud name (public). ToyyibPay is entirely server-only — no ToyyibPay keys ever reach the frontend; it only ever receives the `redirectUrl` the backend returns.

**Backend** (`functions/.env.example`): `FIREBASE_PROJECT_ID`, `SENDGRID_API_KEY`; `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` (media uploads); `TOYYIBPAY_SECRET_KEY`/`TOYYIBPAY_CATEGORY_CODE`/`TOYYIBPAY_BASE_URL` (payments — use sandbox values and `https://dev.toyyibpay.com` while testing, switch to production values + `https://toyyibpay.com` to go live; sandbox and production are separate accounts); `FRONTEND_BASE_URL`/`API_BASE_URL` (the public origins ToyyibPay redirects to / calls back — **cannot be `localhost`**, since ToyyibPay can't reach your machine directly; local webhook testing needs a tunnel, e.g. `ngrok http 5001`, with `API_BASE_URL` pointed at the tunnel). `functions/src/config/env.ts` throws a clear error naming the missing variable if any of these is read before being set, rather than failing silently.

None of these are committed; only `.env.example` placeholder files are tracked.

## Known gaps to close before a real deploy

- No CI/CD pipeline yet (no `.github/workflows`).
- No Storage rules/config exist (expected — media goes through Cloudinary, not Firebase Storage; see `ARCHITECTURE.md`).
- The ToyyibPay webhook has never been exercised against the real gateway in this environment (no tunnel set up, no real sandbox credentials) — verified instead via `payment.service.test.ts` with a mocked `fetch` and a locally-computed valid hash. Test it for real with a tunnel before taking payments live.
