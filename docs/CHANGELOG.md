# Changelog

## 2026-10-02 — Home page: optional background photo for *Choose your room*

- **Admin > Site content > Home page backgrounds** now lists *Choose your room* first (sections in page order). Stored as `siteSettings.sectionBackgrounds.rooms`; the backend schema accepts it (https or empty), older documents need nothing.
- Public: the booking bar and the rooms now share one full-width band (`.rooms-band` in `home.html`). With a photo it starts exactly at the hero's lower edge, so the bar straddles hero and photo (on phones most of the tall bar sits on the photo); dark scrim, white heading/room names, light meta text, light-on-dark loading skeletons; the bar keeps its own colours. Shown only while the rooms load or when there are rooms. Without a photo the section looks as before.
- The gap under the rooms is now the band's padding instead of the facilities band's top margin, so a rooms photo runs flush into the next section (and when there are no facilities, the rooms no longer touch the booking-steps band).
- On the photo the keyboard focus ring uses the brighter gold (`--kunyit`) so it stays at 3:1 or more over a pale photo. The admin hint notes the rooms photo only shows while a room is published.
- Tests: backend 129, frontend 90. Browser-verified against the production build (29 checks, desktop and phone, with and without a photo, normal and reduced motion, keyboard focus).
- **Needs a backend deploy** before the admin can save a rooms photo (the schema change), then a push for the frontend.

## 2026-10-02 — Home page: optional background photo per section; gaps removed

- **Admin > Site content > Home page backgrounds** (new `app-background-field`): for *What you can count on*, *How booking works*, *House rules* and *About the stay* the owner can upload a photo (straight to Cloudinary, folder `homestay/backgrounds`), pick one from the gallery, or paste an https address; Remove returns the section to its default design. Stored as `siteSettings.sectionBackgrounds` (`facilities` / `steps` / `rules` / `about`, https URL or empty), validated by `updateSiteSettingsSchema` (unknown keys dropped), defaulted to `{}` for older documents.
- Public: with a photo a section gets a dark scrim and light text (step nodes turn pale; tiles and the host card stay white); without one it is unchanged. *House rules* keeps the first hero photo as its default. `shared/ui/css-url.ts` escapes the address so a stray quote cannot inject CSS (unit-tested, and checked in a browser).
- The full-bleed sections (facilities band, booking steps, house rules, About) now sit **flush against each other**; the gaps between them are gone (`PolicyShowcase` gained a `flush` input; the steps band lost its top margin; About became a band with its own padding).
- Fixed a bug found while testing: the background address field's validation message never appeared (Material only shows `mat-error` for a control in an error state).
- Tests: backend 128, frontend 88. Browser-verified (35 checks incl. a real Cloudinary upload, cleaned up afterwards, plus all earlier suites).
- **Needs a backend deploy** (`firebase deploy --only functions,firestore`) before the admin can save backgrounds, then a push for the frontend. Not yet deployed or pushed at the time of writing.

## 2026-10-02 — Home page: a distinct design for each section

`public/home/sections/`, each its own component with its own background so the page reads as a sequence of different spaces:

- **What you can count on** (`home-facilities`): light mist band; heading, a small tile-mosaic motif and an intro on the left; the facilities as white icon tiles that flip to dark ink with a gold icon on hover.
- **How booking works** (`home-steps`): white band; four numbered nodes joined by a gold line that draws itself as the section scrolls into view (a vertical timeline on phones), the last node gold, and a "Start with your dates" button.
- **About the stay** (`home-about`): editorial layout; a large lead behind a gold rule (`about-text.ts` splits the first paragraph/sentence from the rest, unit-tested), the host's note as a speech card, a framed photo (second hero photo) with an offset gold block; simplifies when there is no photo, host note or body text.
- New translated lines (EN + BM) for the subtitles, the button and the host note. Tests: frontend 77; browser-verified (33 section checks, reduced motion, phone layouts).

## 2026-10-02 — Policy pages restyled as card sections; typing caret removed

- New `shared/ui/policy-showcase`: a full-width dark photo section (hero photo under an ink scrim) with a small tracked label ("Our policy" / "House rules"), title, subtitle, italic quote, then rounded cream **cards** of items, each with a gold-ringed icon, a heading and a description. Two side-by-side cards (left takes an odd item), anything past eight in a full-width card beneath; cards stack on phones.
- `policy-parse.ts` turns the admin's plain text into items (blank-line blocks; a short first line without a closing full stop becomes the heading), picks icons by keyword in English and Malay (long-standing Material icon names only), and renders free-form text without headings as readable cards. House rules become heading-only items. Unit-tested (15 tests).
- Used for `/privacy`, `/terms` (the whole page, flush under the header), the home page rules and the FAQ page's house rules. An unpublished policy shows a short message instead.
- Footer: five columns now fit on one row; the footer closes up to a page that ends in a policy section.
- The hero typing no longer shows a blinking caret (also removed from the typing logic and its tests).

## 2026-10-02 — Looping typewriter hero text; richer rooms page motion; favicon

- Hero headline and intro line **type, hold (~5 s), erase and repeat**. The timeline is a pure, unit-tested function of time (`shared/ui/hero-typing/typing-logic.ts`); untyped text stays in the same flow (invisible) so lines never re-wrap or shift the layout; the full text is always present for screen readers and crawlers (the animated copy is `aria-hidden`); it pauses in a hidden tab, restarts on a language change, and shows plain text under reduced motion.
- Rooms page: the title draws a gold rule, the dates summary slides in, each room fades up on scroll, photos ease in once loaded (`appImgFade`) and settle from a slight zoom, and on hover the photo zooms, the text nudges and the name's underline thickens.
- Favicon set added to `public/` (ico, 16/32 px PNGs, apple-touch-icon, Android icons, `site.webmanifest` with name "Homestay" and the brand colours) and linked in `index.html` with a `theme-color`.

## 2026-10-02 — Motion across the site; slideshow controls hidden; safe placeholder content

- Motion vocabulary in `styles.scss`: things rise ~20 px and fade in over ~0.6 s; hover/focus changes 0.15-0.3 s; everything off under `prefers-reduced-motion`. Pieces: `appReveal` scroll-reveal directive with staggering; hero entrance; page cross-fade via the router's View Transitions with a stable header; mobile menu slide/fade (`visibility`, so closed links are not focusable); notice pop-up fade (`@starting-style`); FAQ answers ease open (`::details-content`, Chromium 131+); booking steps ease in; hover zoom/underline/lift; photos drift slowly closer while cross-fading.
- The visible slideshow pause/dots pill was removed from the photo. One Pause/Play button remains for keyboard and screen-reader users (invisible until focused), because moving content must be pausable.
- Seed: host intro, contact email/phone, social links and cancellation wording as **clearly-fake placeholders** (an `@example.com` email, an invalid phone number, platform homepages, no street address, wording with no amounts or deadlines). Only empty fields are filled; an owner's real details are never overwritten. Raised the component-style budget warning to 6 kB.
- Tests: backend 123, frontend 42; browser-verified (34 motion checks, 5 seed scenarios).

## 2026-10-02 — Hero slideshow with admin upload and interval; footer navigation, policies, social links

- **Hero slideshow** (`shared/ui/hero-slideshow`): cross-fades through up to 10 photos for a configurable **seconds per photo** (2-30, default 5); pauses when the tab is hidden; no autoplay under reduced motion; next image preloaded. Admin: upload several photos at once (Cloudinary `homestay/hero`), pick from the gallery, add by address, reorder, remove, set the interval. `heroImageUrl` stays the first slide and the social-share image.
- **Header** now Home / Rooms / Gallery; **About, FAQ and Contact moved to the footer**, which also has *Policies* (Privacy, Terms, Cancellation) and *Follow us* (social links). New CMS-managed `/privacy` and `/terms` pages (EN + BM) and a social-links editor (Facebook, Instagram, TikTok, WhatsApp, YouTube, X, Other; https only, up to 8).
- Backend: `heroImages`, `heroIntervalSeconds`, `privacyPolicy`, `termsAndConditions` (+ Malay) with validation and defaults for older documents.
- Seed: a 4-photo slideshow (only if the owner's hero is not their own photo), the interval, and starter Privacy/Terms text in both languages (plain-language, describing only what the site does, **not legal advice**). Social links are never invented.
- **Deployed to production** (`firebase deploy --only functions,firestore`) and the production site seeded on this date. Tests: backend 122, frontend 42; browser-verified including real Cloudinary uploads (cleaned up).

## 2026-10-02 — Skeleton loading; third starter room

- Shared `Skeleton` component (shimmer; switched off under reduced motion; colours overridable per context). Skeletons mirror each page's real layout on the home, rooms, room detail, booking, gallery, About, FAQ, Contact pages, the header/footer name, and the admin dashboard, bookings, accommodation, media and content screens. Each loading region has `aria-busy` and a visually-hidden status; **empty-state messages only appear after loading finishes**; a failed load shows a retry message instead of a skeleton forever (including the admin content page).
- Starter seed: a third placeholder room, **Deluxe Room** (3 guests, sample price), added to the live site.
- Browser-verified with a deliberately slow API: 13/13 pages show a skeleton while loading and none remain after. Tests: backend 112, frontend 19.

## 2026-10-02 — Starter seed: neutral bilingual content, placeholder rooms, hero/gallery photos in the owner's Cloudinary

- `functions/scripts/seed-starter-content.js` (+ `src/seed/starter-content.ts`, validated by the same schemas as the admin forms): bilingual headline/about/facilities/house rules/FAQs, two then three **placeholder rooms**, a 5-photo gallery with accurate alt text, and a hero/share image. Photos are free stock images **uploaded into the owner's Cloudinary** (`homestay/starter`, fixed ids so re-running refreshes rather than duplicates); falls back to the original stock URLs without Cloudinary credentials.
- Safe by design: needs `--project` or `--emulator`; never overwrites existing settings, rooms (or a room whose URL slug is taken) or a non-empty gallery without `--force`; fills only what is empty; emulator runs never upload to Cloudinary unless `--upload`.
- `media.service`: deleting an `external/` (non-Cloudinary) media item no longer calls Cloudinary.
- Admin: a **Hero image** control (preview, gallery picker, https address, remove); the share image follows the hero only when it mirrored it before. A failed Save now returns to the tab that has the problem.
- **All seeded photos are stock images and the room prices are samples**: they must be replaced before real guests book.

## 2026-10-02 — Fixes after code review; language-aware titles; Malay FAQ validation; retry state; email check

- Page `<title>`/description follow the language switch on every public page; the room detail uses the localized description.
- A half-filled Malay FAQ row is a validation error (it used to be dropped silently); Save is never silently disabled.
- Inactive (draft) notices are no longer served to the public API; social/hero URLs are restricted to http(s); a failed settings request shows a retry message; the booking form checks the email's shape before submitting.
- Made a flaky cross-file test deterministic (parallel files share one emulator database).

## 2026-10-02 — Public site redesign ("town stay" design system); English / Bahasa Malaysia; notices and facilities

- Design tokens (ink teal, cool plaster, one turmeric action colour; Bricolage Grotesque + Public Sans), a hero booking bar (check-in, check-out, guests, live night count), notices strip + once-per-visit pop-up, and the home, rooms, room detail, booking, gallery, About, FAQ, Contact and 404 pages rebuilt on the system. Inspired by the structure of resort-booking sites; no third-party branding or content.
- **Language toggle**: UI labels in `shared/i18n/translations/*.ts`; admin-written content translated in the content (`siteSettings.translations.ms`, notices/facilities with inline `*Ms` fields, rooms with `descriptionMs`), Malay falling back to English per field (`localize.ts`, unit-tested). Remembered in `localStorage`; defaults to the browser language.
- Admin Site content editor extended with a Bahasa Malaysia tab, notices and facilities.
- Backend: `notices`, `facilities`, `translations.ms` on the site settings with defaults for older documents.

## 2026-10-02 — Pre-launch hardening: admin bookings, scheduled expiry, CORS, rate limit, payment/availability race fixes

- **Admin Bookings** (`/admin/bookings`): list, *Mark paid & confirm* (money received outside the gateway), *Cancel & release dates*, *Record refund* (bookings paid through ToyyibPay); backend `GET/POST /admin/bookings…` with a `paidOnline` flag.
- **Scheduled expiry** (`expireStaleBookings`, every 10 min) frees the dates of unpaid pending bookings; its transaction now re-reads each booking, so a booking confirmed after selection is never expired; one failing booking no longer stops the sweep.
- **Payment/availability races fixed** (found in review): a late payment after expiry/cancel records the money but never revives the booking (the admin sees "paid" on a lapsed booking and refunds it); a failed callback can never downgrade a paid payment; night release/confirm only touch nights the booking still owns, so refund/cancel can never free dates now owned by another guest; refunding also frees the booking's dates; a booking with a paid online payment must be refunded, not cancelled.
- **CORS** restricted to `ALLOWED_ORIGINS` (default `FRONTEND_BASE_URL`); per-IP **rate limit** (30 / 15 min) on the public booking endpoints; ToyyibPay bills expire after one day.
- CI workflow (`.github/workflows/ci.yml`: build + emulator tests + frontend build).
- Tests: backend 88 at the time; browser-verified.

## 2026-10-02 — `PAYMENT_ENABLED` switch: launch before ToyyibPay approval

With `PAYMENT_ENABLED` unset/`false`, `POST /bookings/:id/payment` returns `503 PAYMENT_NOT_CONFIGURED` without calling ToyyibPay, bookings hold their dates for 48 hours (not 20 minutes) while the owner follows up by hand, and the booking page says payment is being set up. Set it to `true` (with production ToyyibPay keys) once the account is approved.

## 2026-10-02 — Go-live setup

- Production Firebase web config set in `environment.ts`; `vercel.json` (build command, output directory, SPA rewrite); `.gitignore` hardened (`.env.*`, service-account keys, `.runtimeconfig.json`).
- Backend deployed to Firebase (Blaze) and the frontend to Vercel; admin account created with the `create-admin` script.

## 2026-09-19 — Fix: `FIREBASE_PROJECT_ID` in `.env` crashed the entire Functions emulator

Reported by the user: the site loaded (nav, footer, layout) but showed no content at all — no hero text, no rooms, nothing. Diagnosed by checking `firebase-debug.log` directly rather than guessing: `Failed to load function definition from source: FirebaseError: Failed to load environment variables from .env.` — the whole `api` function failed to register, so *every* route 404'd with "Function us-central1-api does not exist," not a partial failure.

**Root cause**: `functions/.env` (and `.env.example`, its template) had `FIREBASE_PROJECT_ID=homestay-cms`. Cloud Functions reserves the `FIREBASE_` key prefix for its own internally-managed config and refuses to load the function at all if a `.env` file defines one — this isn't specific to our code, it's how the platform's dotenv loading works. The line had been sitting in `.env.example` since the original scaffold (before this session), unused by any of our own code (`initializeApp()` auto-detects the project without it), and harmless until this was the first time a real `functions/.env` actually existed to be loaded.

**Fix**: removed the line from both `functions/.env` and `functions/.env.example`, added a warning comment to the latter so it doesn't get re-added. Restarted the emulator cleanly (env var changes need a full restart) and confirmed via `curl` that `/health` and `/site-settings` both work again, returning the real seeded "Persada Hills Homestay" data — no frontend changes were needed, just the backend restart.

Added a dedicated troubleshooting entry to `DEV-MODE.md` for this exact symptom ("every route 404s with an empty valid-functions list").

## 2026-09-19 — Add dummy data seed script; verified persistence end-to-end

Asked directly for dummy data. Added `functions/scripts/seed-dummy-data.js` (same pattern as `create-admin.js` — standalone, `--emulator`-gated, safe to re-run) seeding a fictional "Persada Hills Homestay": full `siteSettings/main` (hero, about, host intro, address/geo, contact, socials, check-in/out, house rules, FAQ, cancellation policy), three accommodations (Garden View Room, Family Suite with a weekend rate override, Cozy Cabin) with Unsplash placeholder photos, and three gallery items.

Ran it for real rather than just handing over the script: started the emulator suite (`--export-on-exit`/`--import` from the persistence work above), seeded the data, created the admin account (`muadzkhalid6@gmail.com` / `password`), then deliberately cycled the emulator (clean `SIGINT` shutdown → confirmed `emulator-data/` actually got written to disk → fresh restart importing from it) to prove the persistence setup from the previous entry genuinely round-trips, not just that the CLI flags exist. All 3 accommodations, site settings, and the admin account survived the restart. Left the emulator running afterward.

Documented the script in `DEV-MODE.md` under a new "Optional: seed placeholder content" section, including the known limitation that its gallery items' placeholder Cloudinary public IDs won't resolve to real assets once Cloudinary is actually configured (delete-via-admin-UI would fail for those specific seeded items; not an issue for anything uploaded for real).

## 2026-09-19 — Persist local emulator data across restarts

Asked directly: local Firestore/Auth emulator data was in-memory only — every restart lost the admin account, rooms, and content, per `DEV-MODE.md`'s own (accurate, at the time) description.

- Added `--export-on-exit=./emulator-data --import=./emulator-data` to the documented `firebase emulators:start` command (`README.md`, `DEVELOPMENT.md`, `DEV-MODE.md`) and to `functions/package.json`'s `serve` script (which also gained the previously-missing `auth` emulator in the same edit).
- Created `emulator-data/` at repo root (required to exist for `--import` to not error on a fresh checkout) with a `.gitkeep`; `.gitignore` updated to `emulator-data/*` + `!emulator-data/.gitkeep` so the directory itself is tracked but its actual data (which can contain guest PII from testing) never is.
- Verified: the installed Firebase CLI's own `--help` output confirms both flags exist and behave as documented (export triggers only on a clean/SIGINT exit) — a full write-restart-read round trip wasn't run against the user's own live emulator to avoid disrupting their active session; this is standard, well-documented Firebase tooling, not custom behavior.
- Updated `DEV-MODE.md`'s troubleshooting section (missing import directory, unclean-shutdown data loss) and its dev-vs-production table.

## 2026-09-19 — Added DEV-MODE.md

Requested directly: a single, ordered walkthrough for running the whole stack locally (frontend + Functions/Firestore/Auth emulators + an optional ngrok tunnel for payment testing), consolidating instructions that had only existed scattered across chat up to this point. Includes a troubleshooting section built from the actual issues hit while first setting this up this session (the `/api/v1` vs `/v1` route-mounting bug, env vars needing a full emulator restart vs. code changes auto-reloading, stray emulator processes holding ports, `create-admin` failing when the Auth emulator isn't running) and a dev-vs-production comparison table. Linked from `docs/README.md`'s index. No code changed.

## 2026-09-19 — Switch payment gateway from Billplz to ToyyibPay

**Reason:** the user needs a registered company (SSM) to open a Billplz account and doesn't have one. ToyyibPay was researched the same way Billplz was before implementing (not assumed): confirmed it explicitly supports individual/personal registration with no SSM requirement (a personal bank account under the Dewan Ekonomi GIG Malaysia structure), confirmed it has a real webhook integrity check (MD5 hash — weaker than Billplz's HMAC-SHA256, but a genuine secret-tied check, not nothing), and confirmed — same as Billplz — it has no documented refund API (their ToS frames refunds as a merchant "instruction" they may decline, not an API call).

**Changed** (all in `functions/src/`, all gateway-internal — the public API shape `createPaymentForBooking`/`markPaymentRefunded`/the `/bookings/:id/payment` and `/payments/webhook/*` routes stays the same, so **no frontend changes were needed** beyond one route-name string):
- `config/env.ts`: `BILLPLZ_*` getters → `TOYYIBPAY_SECRET_KEY`/`TOYYIBPAY_CATEGORY_CODE`/`TOYYIBPAY_BASE_URL` (default `https://dev.toyyibpay.com`). ToyyibPay uses one secret key for both bill creation and callback verification — no separate signing key like Billplz's X-Signature key.
- `services/payment.service.ts`: bill creation now posts to `{TOYYIBPAY_BASE_URL}/index.php/api/createBill` with the secret key *in the form body* (not HTTP Basic Auth) and parses a JSON **array** response (`[{ "BillCode": "..." }]`) rather than an object; the payment page URL is constructed client-side as `{base}/{BillCode}` rather than returned directly. Verification is now `verifyToyyibPaySignature()` — `MD5(secretKey + status + order_id + refno + "ok")` compared with `crypto.timingSafeEqual` — replacing the HMAC-SHA256 `verifyBillplzSignature()`. `handleToyyibPayWebhook()` reads ToyyibPay's field names (`billcode`, `status` as `'1'`/`'2'`/`'3'`, `order_id`, `refno`) in place of Billplz's (`id`, `paid` as `'true'`/`'false'`).
- `types/payment.types.ts`: `gateway: 'billplz'` → `'toyyibpay'`.
- `routes/payment.routes.ts`: `POST /payments/webhook/billplz` → `POST /payments/webhook/toyyibpay`.
- `.env.example` (both projects) and all doc references updated to match.
- Rewrote `payment.service.test.ts` against the new contract (same coverage shape as before, plus one new case: a malformed gateway response missing `BillCode`). 67 tests total (was 66 — one net-new test).

**Verified**: `npm run build` clean; full suite (67/67) run twice in a row against the same live shared emulator to rule out any repeat-run collision like the one found and fixed in the Billplz version; confirmed the new `/v1/payments/webhook/toyyibpay` route is live through the real Functions emulator (`curl` — got the expected 500 from the still-unset `TOYYIBPAY_SECRET_KEY` in that particular running process, not a 404, i.e. routing is correct and the failure is exactly "no credentials configured yet"); confirmed `/health` and `/accommodations` are unaffected. Not verified: an actual round trip against the real ToyyibPay sandbox (no account/tunnel set up in this environment) — same limitation as Billplz had.

**Side note, unrelated to the swap**: this session's test runs (across this and prior phases) have been executing against the user's real local `homestay-cms` Firestore emulator rather than an isolated instance, since that instance was already live when verification ran. This has left ~70 dummy "Test Room"/"Garden Room" accommodation documents in the local dev database. Harmless (Firestore emulator data isn't persisted across restarts by default) but visible in `/admin/accommodation` until the emulator is next restarted — flagged to the user directly.

Updated `PAYMENT.md` (major rewrite — preserves the original Billplz comparison as historical context), `API.md`, `ARCHITECTURE.md`, `DEPLOYMENT.md`, `BOOKING-FLOW.md`, `PROJECT-OVERVIEW.md`, `SECURITY.md`, `DEVELOPMENT.md`.

## 2026-09-19 — Fix: every API route was unreachable through the real Functions emulator/production URL

Found while the user was manually testing the admin dashboard for the first time: login worked, but "Could not verify your session with the backend API" on `/admin/me`. Manual `curl` against the actual emulator URL (`http://127.0.0.1:5001/homestay-cms/us-central1/api/v1/...`) showed a plain Express 404 ("Cannot GET /v1/health") — not our JSON error format, meaning Express was running and receiving requests, just with no matching route.

**Root cause**: the deployed Cloud Function is named `api`. Firebase strips the function-name segment from the URL before Express ever sees the request, so a client calling `.../api/v1/health` has Express receive only `/v1/health`. Every route in `app.ts` was mounted at `/api/v1/...`, which never matched anything a real caller could ever send. This affected **every route in the application**, in every phase back to Phase 3 — it just went undetected because every backend test that exercises HTTP (`admin/auth.routes.test.ts`, via `supertest`) talks to the Express `app` object directly, bypassing the Cloud Functions URL-routing layer entirely. Internally-consistent, passing tests; a genuinely broken app for any real caller. Confirmed via direct `curl` against the live emulator both before and after the fix — not something the automated suite alone would ever have caught.

**Fix**: `app.ts` now mounts everything at `/v1` (not `/api/v1`); `admin/auth.routes.test.ts`'s `supertest` calls updated to match (`/v1/admin/me`, not `/api/v1/admin/me`). No change needed on the frontend — `environment.apiUrl` (`.../api/v1`) was already correct, since that `api` segment is a real, required part of the URL a caller sends; it was only ever the *internal* Express mount that was wrong. See `app.ts`'s new comment and the callout added to `ARCHITECTURE.md`.

Verified: rebuilt (`npm run build`) and confirmed the *already-running* Functions emulator picked up the change without a restart (it watches `lib/`); direct `curl` against `/health`, `/site-settings`, `/accommodations`, and `/admin/me` (401 without a token) all now return correctly through the real emulator URL, not just via `supertest`. Full suite re-run: 66/66 passing (the true total — `admin/auth.routes.test.ts`'s 4 tests were being run all along, just sometimes excluded from the count reported in earlier changelog entries when verifying against an instance missing the Auth emulator; those earlier "49"/"53"/"62" figures undercounted by 4 for that reason, not because tests were missing).

**Lesson for future work on this repo**: a green `supertest`-based route test proves the Express app is internally self-consistent, not that a real client can reach it through the actual Cloud Function URL. Whenever a new route is added, sanity-check it with a real `curl` against the running emulator at least once, the way `DEVELOPMENT.md` now describes — don't rely on `npm test` alone for that specific class of bug.

## 2026-09-19 — Phase 7: Billplz payment integration

- **Researched the exact Billplz API contract before implementing** (create-bill endpoint/auth/fields, webhook field list, X-Signature algorithm) rather than guessing from the earlier planning-phase comparison — and found the earlier plan's refund claim was wrong.
- **Correction**: Billplz has **no refund API** at all (confirmed directly against their docs — only *due*, i.e. unpaid, bills can even be deleted via API; paid bills cannot). `PAYMENT.md`'s refund section is rewritten accordingly: the admin refund action only records our own state, it never moves money — the admin processes the actual refund manually in the Billplz dashboard.
- Added `functions/src/services/payment.service.ts`: `createPaymentForBooking` (creates a Billplz bill via `POST /api/v3/bills`, HTTP Basic Auth with the secret key, amount in cents; reuses an existing pending bill instead of duplicating one on retry; deliberately called *outside* the booking-creation Firestore transaction, since an external HTTP call inside a retryable transaction risks duplicate bills), `verifyBillplzSignature` (sorts all fields but `x_signature` case-insensitively, joins `key+value` pairs with `|`, HMAC-SHA256s with the X Signature key, compares with `crypto.timingSafeEqual`), `handleBillplzWebhook` (only this — never the frontend — can flip a booking to `confirmed`), `markPaymentRefunded` (record-only, per the correction above).
- Added `functions/src/config/env.ts` getters for `BILLPLZ_SECRET_KEY`/`BILLPLZ_COLLECTION_ID`/`BILLPLZ_X_SIGNATURE_KEY`/`BILLPLZ_BASE_URL`/`FRONTEND_BASE_URL`/`API_BASE_URL`.
- Added routes: `POST /bookings/:id/payment` (creates the bill, returns `{ redirectUrl }`), `POST /payments/webhook/billplz` (no auth middleware — the signature check inside the handler is the actual authentication), `POST /admin/bookings/:id/refund` (backend only; no admin bookings screen exists yet to call it from). Registered `express.urlencoded()` in `app.ts` since Billplz posts the webhook as form data, not JSON.
- **Frontend**: `booking.service.ts` gained `createPayment()`; the booking flow now calls it automatically right after a booking is created and redirects the browser (`window.location.href`) to Billplz's hosted page. If that call fails — the expected case here, since this environment has no real Billplz credentials — the guest simply stays on the existing "pending payment, we'll contact you" confirmation instead of hitting an error.
- Tests: added `payment.service.test.ts` (13 tests) — signature verification (valid, tampered, missing), bill creation (including the duplicate-prevention path, via a mocked `fetch`), the full webhook flow (paid → confirmed, not-paid → failed, invalid signature rejected, unknown bill id is a silent no-op), and refund recording. Backend suite: 62 tests, all passing. Frontend: `ng build` and `ng test` (3/3) pass.
- **Known gap, stated plainly**: the webhook has never been exercised against the real Billplz gateway — Billplz cannot reach `localhost`, so that needs a public tunnel (e.g. `ngrok`) this environment doesn't have. Confidence here comes from the mocked/signature-computed test suite, not a live round trip.
- **Test bug found and fixed during verification**: the first version of `payment.service.test.ts` used fixed literal mock bill IDs (`'bp-bill-2'`, etc.). Re-running the suite against the same persistent (not freshly-recreated) Firestore instance a second time caused 3 failures — a leftover `payments` doc from the earlier run shared the same `gatewayBillId`, so the webhook handler's `.limit(1)` lookup picked up the stale doc instead of the current test's. Fixed by generating a unique bill id per test (matching the pattern already used elsewhere, e.g. `media.service.test.ts`'s `cloudinaryPublicId`); re-ran the full suite three times in a row afterward to confirm it's no longer order/repetition-sensitive.
- Updated `PAYMENT.md`, `BOOKING-FLOW.md`, `API.md`, `ARCHITECTURE.md`, `DEPLOYMENT.md`, `PROJECT-OVERVIEW.md` to match.

## 2026-09-19 — Phase 6: booking flow (no payment yet)

- Added `getBookingByReferenceAndEmail()` to `booking.service.ts` — the guest-facing, no-account lookup; requires both reference and email so a (short, somewhat guessable) reference alone can't be used to view someone else's booking.
- Added `functions/src/routes/booking.routes.ts` (`POST /bookings`, `GET /bookings/lookup`) and a new `GET /accommodations/:id/availability` route in `public.routes.ts` — all public (guests never authenticate), all validated by new `functions/src/validation/booking.schema.ts` schemas, all thin pass-throughs to the already-tested `booking.service`.
- **Frontend**: added `shared/services/booking.service.ts`, and the actual booking flow at `/booking` — a 3-step guest journey (dates/guests → guest details → review & confirm) reached from a date/guest-picker widget on each accommodation's detail page. Client-side checks (min/max stay, capacity) give instant feedback before the real server-side availability check runs; the server remains the sole source of truth for both availability and pricing (the client never computes or submits a price — it only appears after the server returns it in the created booking).
- **Honesty about scope**: booking creation ends at `pending_payment` with an in-page message that the homestay will follow up to arrange payment — there is no fake "booking confirmed" state, no payment gateway is wired up yet (that's `PAYMENT.md`'s phase), and there's no confirmation email yet (that's the notifications phase). No booking-lookup page was built in the frontend yet since the confirmation step already shows the reference directly and there was no immediate UX need for a separate one.
- Tests: added 4 to `booking.service.test.ts` (`getAvailability` reporting only real taken nights; `getBookingByReferenceAndEmail` — found, wrong-email 404, unknown-reference 404). Backend suite: 53 tests, all passing (verified against the same real, already-running Firestore emulator used in Phase 5 — not a fresh isolated run, since that instance was already up; see `DEVELOPMENT.md` for why a long-running local emulator occasionally needs a restart to see new routes). Frontend: `ng build` and `ng test` (3/3) pass; the full booking flow itself was verified through the tested service layer (which now covers the same sequence — check availability, create, look up — a raw HTTP client would exercise) rather than a live browser session, which this environment can't drive.
- Updated `BOOKING-FLOW.md`, `API.md`, `ARCHITECTURE.md`, `PROJECT-OVERVIEW.md` to match.

## 2026-09-19 — Phase 5: site content CMS + public website

- Added the site-content CMS piece skipped in Phase 3: `functions/src/services/site-settings.service.ts` (`getSiteSettings` returns built-in defaults if the singleton doc has never been saved — never 404s), `validation/site-settings.schema.ts`, `routes/admin/content.routes.ts` (`GET`/`PUT /admin/site-settings`), and an admin editor at `/admin/content` (hero copy, about, host intro, address, contact, check-in/out, cancellation policy, house rules and FAQ as add/remove `FormArray`s).
- Added public read-only routes (`functions/src/routes/public.routes.ts`, no auth): `GET /site-settings`, `GET /accommodations` (active only — new `listActiveAccommodations()`), `GET /accommodations/:slug` (new `getActiveAccommodationBySlug()` — 404s for inactive too, so an inactive unit reads as "not found" rather than leaking its existence), `GET /gallery` (new `listGalleryMedia()`, filtered to `association.type === 'gallery'`). Added the two new composite indexes these queries need (`accommodations` on `active`+`name`, `media` on `association.type`+`order`) to `firestore.indexes.json`.
- **Built the actual public website** on top of the above: `public-layout` (nav + footer, reads `siteSettings`), Home, Accommodation (list + detail), Gallery, About (with a key-free Google Maps embed — no API key needed), FAQ & house rules (native `<details>` accordion), Contact (info + mailto/tel/WhatsApp links — no submission form, since there's no email-sending backend yet to receive one), and a 404 page. All wired into `app.routes.ts` as children of `PublicLayout`, replacing the temporary `'' → /admin/login` redirect from Phase 3.
- Added `core/seo.service.ts` — sets `<title>`/meta description per page. Full technical SEO (sitemap, robots.txt, structured data, Open Graph) stays deliberately deferred to the SEO/performance phase rather than half-built here.
- **Design decision**: replaced Angular Material's default azure theme with `mat.$orange-palette` (warm terracotta) and added a serif display font (Fraunces) for headings, so the site doesn't read as a generic Material app shell — see `docs/UI-UX.md`. Public pages are hand-built semantic HTML/SCSS rather than Material card layouts, per the standing design decision from that doc.
- Tests: added `site-settings.service.test.ts` (3 tests) and extended `accommodation.service.test.ts`/`media.service.test.ts` with public-listing coverage (3 + 1 tests). Backend suite: 49 tests total. Frontend: `ng build` and `ng test` (3/3) pass; all new public/admin-content components compile and lazy-load correctly.
- **Known gap**: the user's own long-running local `firebase emulators:start` process was still serving pre-Phase-4 compiled code when checked (the Functions emulator doesn't hot-reload `lib/` — it needs a restart to pick up new routes). Flagged directly rather than silently working around it; a full manual click-through of the new public site in a browser has not been done in this session.
- Updated `ARCHITECTURE.md`, `CMS.md`, `API.md`, `SEO.md`, `UI-UX.md`, `PROJECT-OVERVIEW.md` to match.

## 2026-09-19 — Phase 4: accommodation + media management

- Added `functions/src/services/accommodation.service.ts` and `routes/admin/accommodation.routes.ts` — full CRUD for room/unit types (`functions/src/validation/accommodation.schema.ts` for request validation). Enforces slug uniqueness and `minStay <= maxStay` at write time (checked against the merged record for partial updates, not just the request body in isolation). Deleting an accommodation with any existing booking is rejected with 409 `ACCOMMODATION_HAS_BOOKINGS` — the fix is to deactivate it, not delete it, so booking history never points at a missing accommodation.
- Added `functions/src/services/media.service.ts` and `routes/admin/media.routes.ts` — Cloudinary-backed media management: a signed-upload endpoint so the browser can upload directly to Cloudinary without the API secret ever reaching it, plus record/list/update/delete for the resulting media items (delete removes the Cloudinary asset itself, not just the Firestore reference). Added the `cloudinary` SDK dependency and `functions/src/config/env.ts` (typed, lazily-checked env var access — a clear error naming the missing variable, not a silent failure or an unrelated route crashing at cold start).
- Wired both route files into `app.ts`.
- **Frontend**: added `admin/accommodation/` (list + `accommodation-form-dialog/` for create/edit, including inline photo upload that writes straight into the accommodation's own `photos` array) and `admin/media/` (gallery manager — upload, inline alt-text editing, delete). Added `shared/services/accommodation.service.ts` and `shared/services/media.service.ts` (the latter uploads to Cloudinary via a direct `fetch` call, deliberately bypassing `HttpClient`/`auth.interceptor` so the Firebase ID token is never sent to a third-party host). Dashboard now links to both new pages.
- Tests: `accommodation.service.test.ts` (9 tests, against the Firestore emulator — covers create/read/update/delete, slug-uniqueness, stay-range validation, and the delete-with-bookings guard) and `media.service.test.ts` (5 tests, against a mocked Cloudinary SDK — no real Cloudinary account needed to verify the signing/record/update/delete logic, though actually uploading a file does need real credentials, which this environment doesn't have yet). Backend suite: 42/42 passing. Frontend: `ng build` and `ng test` (3/3) still pass.
- Updated `ARCHITECTURE.md`, `CMS.md`, `API.md`, `DEPLOYMENT.md`, `PROJECT-OVERVIEW.md` to match.
- Known gaps, deliberately deferred rather than half-built: no UI yet for `weekdayRates`/`seasonalRates` (backend supports them; only base price is editable from the form), amenities are free-text rather than a fixed multi-select list, no drag-to-reorder for gallery items.

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
