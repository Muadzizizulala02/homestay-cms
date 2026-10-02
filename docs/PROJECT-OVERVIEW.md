# Project Overview

## What this is

A production-ready booking website + CMS for a **single homestay** (one physical property, multiple room/unit types). Not a multi-host marketplace.

- **Guests** never create an account. They browse the site, check availability, book, and pay as a one-off transaction, identified only by a booking reference + contact email.
- **Admin** (the homestay owner/operator) is the only authenticated role. They manage all website content, accommodation, availability, bookings, and payments through a CMS dashboard.

## Status

Planning complete (2026-09-19). Implemented so far:
- **Backend data layer**: Firestore types, the transaction-based booking service (double-booking prevention verified under concurrent load), pricing calculation, auth/validation/error middleware.
- **Admin auth**: real Express app (`app.ts`) with a working `requireAdmin`-protected route (`GET /admin/me`), an admin provisioning script (no public registration endpoint), and a frontend login page + route guard + dashboard shell backed by Firebase Auth.
- **Accommodation + media CMS**: full create/read/update/delete for room/unit types, and a Cloudinary-backed signed-upload flow for both the general gallery and per-accommodation photos, each with a working admin UI (`/admin/accommodation`, `/admin/media`).
- **Site content CMS**: `siteSettings` singleton (hero copy, about, contact, check-in/out, house rules, FAQ, cancellation policy) with an admin editor at `/admin/content`.
- **Public website**: Home, Accommodation (list + detail), Gallery, About, FAQ & house rules, Contact — all live, all reading real data from the backend (no hardcoded content). Placeholder/default copy renders correctly out of the box before any admin editing happens.
- **Booking flow + payment**: a guest can pick a unit, check real availability, create an actual `pending_payment` booking with server-computed pricing and the transactional double-booking-prevention guarantee, and be redirected to a real ToyyibPay-hosted payment page. ToyyibPay's webhook (hash-verified server-side, per `PAYMENT.md`) is what actually confirms a booking — nothing on the frontend can do that. If payment creation fails (no real ToyyibPay credentials exist in this environment yet) the guest still gets a valid pending booking and an honest "we'll contact you" message rather than a broken flow.

Not yet built: availability calendar management (admin-side manual blocking), the bookings admin list/detail/status screen (a backend refund endpoint exists — `PAYMENT.md` — but nothing calls it yet), booking confirmation emails (Phase 8). Full technical SEO (sitemap, robots.txt, structured data) is deferred to the dedicated SEO/performance phase; today each public page only sets its own `<title>`/meta description. See `CHANGELOG.md` for the detailed log.

## Scope decision: superseding the original plan

The repo originally contained `HOMESTAY_CMS_PROJECT_PLAN.md`, a generic template plan for a **multi-host marketplace** (guest accounts, host accounts, host-owned "properties", guest-submitted reviews, host payouts). That plan is superseded by this one.

> **Decision:** Build a single-homestay CMS with admin-only authentication, not a multi-tenant marketplace.
> **Reason:** The actual product requirement is one business's own site, not a platform for multiple hosts. Guest accounts and a host role add auth complexity, data model complexity, and UX friction (guests having to register just to book a homestay) with no corresponding benefit for this use case.
> **Impact:** No `users`/`guests`/`reviews`/multi-owner `properties` collections. The `auth/register`, `host/*`, `guest/*` folders scaffolded in the frontend are dropped (they were empty, so no migration cost). See `ARCHITECTURE.md` and `DATABASE.md`.

## Out of scope (v1)

- Guest accounts / guest login
- Multi-property or multi-host support
- Guest-submitted reviews (admin-curated testimonials may be added later — open decision, see below)
- Self-service guest cancellation (admin-only for v1 — open decision, see below)
- Booking reminder emails (nice-to-have, deferred)

## Open decisions (not yet made by the product owner)

These don't block current implementation but should be decided before the phases that touch them:

1. Guest self-service cancellation via the booking-lookup page vs. admin-only.
2. Admin-curated testimonials on the homepage — in scope or not.
3. Whether a second admin/staff account with limited permissions is needed (affects the auth-claim shape).
4. Confirm Privacy Policy / Refund Policy pages as simple CMS-editable long-form content (needed once payments go live).
5. Booking reminder emails — in scope now or deferred.

## Page structure (public site)

Home · Accommodation (list + detail) · Gallery · About & Location · FAQ & House Rules · Contact · Booking flow (non-indexed) · Booking lookup (non-indexed). Full rationale in `SEO.md`.
