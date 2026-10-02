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

**Backend** (`functions/.env.example`): `FIREBASE_PROJECT_ID`, `SENDGRID_API_KEY`; `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` (media uploads); `TOYYIBPAY_SECRET_KEY`/`TOYYIBPAY_CATEGORY_CODE`/`TOYYIBPAY_BASE_URL` (payments — use sandbox values and `https://dev.toyyibpay.com` while testing, switch to production values + `https://toyyibpay.com` to go live; sandbox and production are separate accounts); `ALLOWED_ORIGINS` (optional, comma-separated browser origins allowed by CORS; defaults to `FRONTEND_BASE_URL` — add your custom domain *and* the `*.vercel.app` one while both are in use; a missing origin shows up as a CORS error in the browser console); `FRONTEND_BASE_URL`/`API_BASE_URL` (the public origins ToyyibPay redirects to / calls back — **cannot be `localhost`**, since ToyyibPay can't reach your machine directly; local webhook testing needs a tunnel, e.g. `ngrok http 5001`, with `API_BASE_URL` pointed at the tunnel). `functions/src/config/env.ts` throws a clear error naming the missing variable if any of these is read before being set, rather than failing silently.

**Launching before ToyyibPay is approved:** leave `PAYMENT_ENABLED` unset/`false`. `POST /bookings/:id/payment` then returns `503 PAYMENT_NOT_CONFIGURED` without contacting ToyyibPay, the booking page shows a "payment is being set up, we'll contact you" notice, and bookings hold their dates for 48 hours (not 20 minutes) while you follow up manually. When ToyyibPay approves you, set `PAYMENT_ENABLED=true` with the production keys and redeploy functions.

None of these are committed; only `.env.example` placeholder files are tracked.

## Known gaps to close before a real deploy

- CI (`.github/workflows/ci.yml`) builds and tests on every push/PR, but it has never run on GitHub yet — check the first run. There is no automatic *deploy*: functions are deployed manually (`firebase deploy`); the frontend deploys via Vercel's GitHub integration.
- No Storage rules/config exist (expected — media goes through Cloudinary, not Firebase Storage; see `ARCHITECTURE.md`).
- The ToyyibPay webhook has never been exercised against the real gateway in this environment (no tunnel set up, no real sandbox credentials) — verified instead via `payment.service.test.ts` with a mocked `fetch` and a locally-computed valid hash. Test it for real with a tunnel before taking payments live.

## Scheduled jobs

`expireStaleBookings` (Cloud Scheduler, every 10 minutes) expires `pending_payment` bookings whose hold has lapsed and frees their dates. It is created automatically by `firebase deploy --only functions` (Blaze plan; Firebase will enable the Cloud Scheduler API on first deploy).

## Admin: managing bookings while payment is manual

`/admin/bookings` lists every booking. **Mark paid & confirm** records money you received outside the gateway; **Cancel & release dates** frees the dates; **Record refund** is for bookings paid through ToyyibPay (it does not send money — refund through ToyyibPay first).

## Starter content for a new site

A brand-new site has no content, so the public pages look unfinished. `functions/scripts/seed-starter-content.js` seeds, in English and Bahasa Malaysia:

1. **Site settings** (headline, about, four common facilities, house rules, FAQs) plus a **hero / social-share image**. It invents **no** address, phone, email or refund terms.
2. **A gallery** of five photos, each with accurate alt text.
3. **Two placeholder rooms** (Standard Room, Family Room), RM 150 / RM 250 per night.

**All photos are stock images (Unsplash) and the room prices are made-up samples — not your property.** Replace them before real guests book: rooms in Admin > Accommodation, gallery photos in Admin > Gallery, the hero in Admin > Site content > Hero image. Review every line of text too: the facilities and house rules are generic and may not match your property.

**Images are uploaded into your own Cloudinary account** (folder `homestay/starter`, fixed ids so re-running refreshes rather than duplicates), using `CLOUDINARY_*` from the environment or `functions/.env`. They then behave like photos you uploaded yourself: served as WebP/AVIF at a sensible size, deletable from the admin. If Cloudinary is not configured, or with `--no-upload`, the original stock URLs are used (these are marked `external/` so deleting them in the admin never calls Cloudinary).

```
cd functions
npm run build
# real project (needs GOOGLE_APPLICATION_CREDENTIALS pointing at a service-account key; delete the key afterwards)
node scripts/seed-starter-content.js --project=homestay-cms
# local emulators (does NOT upload to Cloudinary unless you add --upload)
node scripts/seed-starter-content.js --emulator
```

Flags: `--no-rooms`, `--no-gallery`, `--no-upload`, `--upload` (emulator only), `--force`. It refuses to run without `--project` or `--emulator`. **Nothing you already have is overwritten without `--force`:** existing settings are left alone (except an *empty* hero / share image, which is filled in), rooms that exist or whose URL slug is taken are skipped, and the gallery is only seeded when it has no photos. The content lives in `functions/src/seed/starter-content.ts` and is validated by the same schemas as the admin forms (`npm test`). The older `seed-dummy-data.js` is a local-only demo (fake business) and refuses to run against a real project.
