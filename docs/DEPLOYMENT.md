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

## Environment variables (planned — see each project's `.env.example`)

**Frontend** (`homestay-cms-frontend/.env.example`): Firebase web config keys, API base URL, Cloudinary cloud name (public), Billplz is server-only (no public keys needed client-side beyond the redirect URL returned by the API).

**Backend** (`functions/.env.example`): `FIREBASE_PROJECT_ID`, `SENDGRID_API_KEY`, and — as of Phase 4 — `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` (required for the media/accommodation-photo upload routes; `functions/src/config/env.ts` throws a clear error naming the missing variable if one of these is read before being set, rather than failing silently). Billplz secret key + collection ID + X-Signature key will be added when `payment.service` is implemented (Phase 6 — see `PAYMENT.md`). The stale `STRIPE_SECRET_KEY`/`STRIPE_PUBLIC_KEY` entries left over from the superseded plan have been removed from both `.env.example` files.

None of these are committed; only `.env.example` placeholder files are tracked.

## Known gaps to close before a real deploy

- No CI/CD pipeline yet (no `.github/workflows`).
- `.gitignore` does not yet explicitly exclude service-account key files (`*serviceAccount*.json`, `*firebase-adminsdk*.json`) — add this even though no such file exists yet, as a safety net.
- No Storage rules/config exist (expected — media goes through Cloudinary, not Firebase Storage; see `ARCHITECTURE.md`).
