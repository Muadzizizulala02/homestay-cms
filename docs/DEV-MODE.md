# Dev Mode

A single walkthrough for running the whole system locally — frontend, backend, database, and payment gateway — none of it touching real production infrastructure. This consolidates what `DEVELOPMENT.md` covers piecemeal into one ordered recipe, plus the specific gotchas found while first setting this up.

## What "dev mode" actually is

Three independent local processes, none of them the real Firebase project or real ToyyibPay:

| Process | What it is | Port |
|---|---|---|
| `ng serve` | The Angular frontend, live-reloading | 4200 |
| Firebase Functions emulator | Runs the real `app.ts` Express code, locally | 5001 |
| Firebase Firestore emulator | An in-memory Firestore, persisted to disk on exit (see below) | 8080 |
| Firebase Auth emulator | A fake Firebase Auth — accounts here don't exist anywhere else | 9099 |
| Emulator UI | A web dashboard over the three emulators above | 4000 |

`homestay-cms` is the real Firebase project's name, but in dev mode nothing under that name is real — the emulators just borrow the project ID so the frontend's config doesn't need to change between dev and prod. No real Firebase billing, no real Firestore data, no real ToyyibPay charges happen in this mode.

## Starting everything (order matters)

**1. Backend — build, then start all three emulators together:**

```bash
cd functions
npm install       # first time only
npm run build
cd ..
firebase emulators:start --only functions,firestore,auth --export-on-exit=./emulator-data --import=./emulator-data
```

(`npm run serve` in `functions/` does the same thing, with the flags already baked in.)

Wait for the terminal to print all three as running before continuing. Leave this terminal open — this is your backend for the whole session.

**Data persists across restarts** thanks to the two flags above: `--export-on-exit` writes Firestore/Auth state to `./emulator-data` (gitignored) whenever the emulator shuts down cleanly (Ctrl+C), and `--import` loads it back in on the next start. So your admin account, rooms, and content survive a restart — you don't need to redo the one-time setup steps below every session, only the first time. Two things to know:
- **An unclean shutdown (crash, `kill -9`, closing the terminal without Ctrl+C) skips the export** — you'll lose whatever changed since the last clean exit.
- **To deliberately reset to a clean slate**, stop the emulator and delete the export: `rm -rf emulator-data/*` (this also removes the tracked `.gitkeep` — recreate it with `touch emulator-data/.gitkeep` if you want the empty dir to stay committed, though it isn't required for the emulator itself to work).

**2. Frontend — in a separate terminal:**

```bash
cd homestay-cms-frontend
npm install        # first time only
ng serve
```

Visit `http://localhost:4200`.

**3. (Only if testing payments) — a tunnel, in a third terminal:**

```bash
ngrok http 5001
```

Copy the `https://....ngrok-free.app` URL it prints — you'll need it in step 4 below. This step is optional if you're just testing content/booking creation without a real payment gateway round trip.

## One-time setup: environment files

Neither `.env` file is committed (see `.gitignore`) — create them from the `.env.example` in each project the first time.

**`functions/.env`** — required for media uploads and payments to work at all locally:

```bash
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

TOYYIBPAY_SECRET_KEY=...
TOYYIBPAY_CATEGORY_CODE=...
TOYYIBPAY_BASE_URL=https://dev.toyyibpay.com

FRONTEND_BASE_URL=http://localhost:4200
API_BASE_URL=<your current ngrok URL, from step 3 above>
```

**Env vars are only read when the emulator process starts** — unlike code changes (which the Functions emulator picks up automatically on rebuild, no restart needed), editing `.env` requires stopping and restarting `firebase emulators:start`. `ngrok`'s free tier also hands you a new URL every time it restarts, so `API_BASE_URL` needs updating (and the emulator restarting again) each time you start a fresh tunnel.

Without Cloudinary/ToyyibPay configured, everything else still works — media upload and payment creation just fail gracefully (a clear error in the admin UI for media; the booking flow falls back to its "we'll contact you" message instead of redirecting to a payment page).

## One-time setup: an admin account

One-time as long as `emulator-data/` keeps persisting across restarts (see above) — if you ever reset it, just re-run this. There's no sign-up page — admins are provisioned with a script, and it's always safe to re-run:

```bash
cd functions
npm run create-admin -- --email=you@example.com --password=yourpassword --emulator
```

This only works while the Auth emulator (step 1) is running, and only creates the account in that emulator — it has nothing to do with any real Firebase Auth user.

## Optional: seed placeholder content

So the site isn't empty while you're clicking around, `functions/scripts/seed-dummy-data.js` writes a full `siteSettings/main`, three accommodations, and a few gallery photos (all obviously-placeholder content — a fictional "Persada Hills Homestay"). Safe to re-run; it overwrites the same fixed records rather than duplicating them:

```bash
cd functions
node scripts/seed-dummy-data.js --emulator
```

Refuses to run without `--emulator` — there's no path to point this at production. Gallery items use placeholder Cloudinary public IDs that don't correspond to real assets, so deleting them via the admin UI will fail once Cloudinary is actually configured; that's expected, just remove them directly in the Firestore Emulator UI if they get in the way.

## Using it

1. **Admin**: `http://localhost:4200/admin/login` → sign in → `/admin/content` (fill in real-ish copy), `/admin/accommodation` (add a room).
2. **Guest**: `http://localhost:4200/` in a separate/incognito window → browse → book a room → pay (redirects to ToyyibPay sandbox if configured, otherwise shows the fallback confirmation).
3. **Inspect data**: `http://localhost:4000` (Emulator UI) → Firestore tab — see the `accommodations`, `bookings`, and `payments` documents your actions just created.
4. **Watch the webhook** (if using ngrok): `http://127.0.0.1:4040` — ngrok's own inspector shows every incoming request to your tunnel, including ToyyibPay's callback and its response code.

## Troubleshooting

**"Cannot GET /..." from the backend, in the browser or via curl.** This is Express's own 404, meaning the request reached the emulator but no route matched. Check that the path doesn't include a stray `/api` — the deployed Cloud Function is named `api`, and Firebase strips that segment before Express ever sees the request, so Express routes only ever match `/v1/...`, never `/api/v1/...` (see `app.ts`'s comment, and `ARCHITECTURE.md`). This exact thing broke every route for a while before being caught — see `CHANGELOG.md`.

**A route that should exist still 404s after you just added it.** Did you run `npm run build` in `functions/`? The emulator watches the compiled `lib/` output and reloads it automatically — but only if it's actually been recompiled from your `src/` changes.

**Something that reads an env var is broken, but the route exists.** Env vars are only loaded at emulator *startup*, not picked up live like code is. Stop (Ctrl+C) and restart `firebase emulators:start`.

**Every single route 404s with "Function us-central1-api does not exist, valid functions are: " (empty), even `/health`.** This is not a routing problem — the whole function failed to load. Check the Functions emulator's own terminal output (or `firebase-debug.log`) for `Failed to load function definition from source: FirebaseError: Failed to load environment variables from .env.` — this happens if `functions/.env` defines a key with a **reserved prefix** (`FIREBASE_`, among others); Cloud Functions refuses to load the whole function rather than partially applying the file. Remove the offending line and restart. (This bit us once already: `FIREBASE_PROJECT_ID` was in `.env.example` since the original scaffold, unused by any of our own code, and silently fine for months because no real `.env` existed to trigger it until one finally did.)

**`Error: Could not start ... Emulator, port taken.`** A previous emulator run didn't shut down cleanly. Find and stop it:

```bash
lsof -i :8080   # or :9099, :5001
kill <pid>
```

**`create-admin` fails with `ECONNREFUSED 127.0.0.1:9099`.** The Auth emulator isn't running — you likely started the emulator suite without `--only functions,firestore,auth` (missing `auth`), or the Auth emulator crashed. Restart with all three.

**`Error: Did not find import directory ./emulator-data`.** The `--import` flag needs the directory to already exist (even empty) — it doesn't create one for you. Run `mkdir -p emulator-data` once and retry; this repo already tracks it via `.gitkeep` so a normal `git clone` shouldn't hit this.

**Everything's gone after a restart even though you set up persistence.** The last shutdown wasn't clean — `--export-on-exit` only fires on a graceful stop (Ctrl+C once, not a force-kill). If you killed the terminal, closed the window, or the process crashed, that session's changes were never written to `emulator-data/`.

**Admin dashboard shows "Could not verify your session with the backend API."** Confirm the Functions emulator is actually up and rebuilt (see the two 404 troubleshooting points above) — this is the symptom of `GET /admin/me` failing, not an auth-specific bug.

## How this differs from production

| | Dev mode | Production |
|---|---|---|
| Frontend | `ng serve`, `http://localhost:4200` | Deployed to Vercel |
| Backend | Functions emulator | Real Cloud Function, requires the Blaze plan |
| Database | In-memory, persisted to `emulator-data/` on clean exit only | Real Firestore, always persists |
| Auth | Fake accounts, only exist locally | Real Firebase Auth |
| ToyyibPay | Sandbox (`dev.toyyibpay.com`), fake money | Live (`toyyibpay.com`), real money |
| `FRONTEND_BASE_URL`/`API_BASE_URL` | `localhost`/ngrok tunnel | Real deployed domains |

Nothing about the *code* changes between the two — only which URLs and keys are configured. See `DEPLOYMENT.md` for going live.
