# CMS

Status: accommodation and media management are implemented (backend + admin UI). Site content, availability, and bookings screens are still planned.

Deliberately small in scope — this serves one owner-operator, not a multi-tenant CMS.

## Site content

Single editor for the `siteSettings` singleton: hero, headline/intro, about copy, host intro, location/map, contact info, social links, check-in/out times, house rules, FAQ items (ordered), cancellation/refund policy, legal pages (privacy/terms — pending confirmation, see `PROJECT-OVERVIEW.md`), SEO defaults, social share image.

## Media

✅ **Implemented**: `/admin/media` — upload to Cloudinary via a backend-signed-upload endpoint (`POST /admin/media/sign-upload`, `functions/src/services/media.service.ts`), the browser then uploads directly to Cloudinary so the API secret never leaves the server. Delete removes the asset from Cloudinary via `cloudinary.uploader.destroy()`, not just the Firestore reference. Alt text is editable inline.

This general gallery manager is decoupled from accommodation photos by design: an accommodation's `photos` field is a plain array of Cloudinary URLs managed from within the accommodation form itself (same signed-upload flow, different call — `MediaService.uploadRaw()` skips writing a `media` collection document). The `media` collection is specifically for the general Gallery page's content, not per-room photos.

Not yet built: reordering (the `order` field exists and defaults to append-order, but there's no drag-to-reorder UI yet), assigning an existing gallery item to an accommodation after the fact.

## Accommodation

✅ **Implemented**: `/admin/accommodation` (`functions/src/services/accommodation.service.ts`, `functions/src/routes/admin/accommodation.routes.ts`) — create/read/update/delete for room/unit types: slug, name, description, photos, capacity, beds, amenities (free-text, comma-separated in the UI — not yet a fixed multi-select list), base price, min/max stay, active/inactive toggle. Deleting an accommodation that has any bookings is rejected (409 `ACCOMMODATION_HAS_BOOKINGS`) — the admin is told to deactivate it instead, so booking history is never orphaned.

Not yet built: an editing UI for `weekdayRates`/`seasonalRates` (the backend type and validation support them; only base price is editable from the form today) — a fixed-list amenity picker instead of free text.

## Availability

Calendar view per unit to manually block/unblock dates (maintenance, owner use). Writes directly into the same `availability` subcollection the booking transaction uses (`DATABASE.md`), so there is one source of truth — no separate "admin blocked dates" table to keep in sync.

## Bookings

Table with filters (status, payment status, date range, unit) and search (guest name / reference / phone). Detail view. Manual status override. Refund trigger (calls into the payment service — see `PAYMENT.md`).

## SEO fields exposed to the admin

Per-page meta title/description override, social share image, image alt text (pre-filled with a sensible default, editable). Deliberately **not** exposed: schema markup, canonical URLs, robots directives — those are automated so a content edit can't break them (see `SEO.md`).
