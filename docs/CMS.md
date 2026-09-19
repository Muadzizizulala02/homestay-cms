# CMS

Status: planned, not yet implemented.

Deliberately small in scope — this serves one owner-operator, not a multi-tenant CMS.

## Site content

Single editor for the `siteSettings` singleton: hero, headline/intro, about copy, host intro, location/map, contact info, social links, check-in/out times, house rules, FAQ items (ordered), cancellation/refund policy, legal pages (privacy/terms — pending confirmation, see `PROJECT-OVERVIEW.md`), SEO defaults, social share image.

## Media

Upload to Cloudinary via a backend-signed-upload endpoint. Assign each item to the general gallery or to a specific accommodation. Reorder. Delete removes the asset from Cloudinary too, not just the Firestore reference (avoids orphaned files).

## Accommodation

CRUD for room/unit types: name, slug, description, photos, capacity, beds, amenities (multi-select from a fixed list), base price, seasonal rate rules, min/max stay, active/inactive toggle.

## Availability

Calendar view per unit to manually block/unblock dates (maintenance, owner use). Writes directly into the same `availability` subcollection the booking transaction uses (`DATABASE.md`), so there is one source of truth — no separate "admin blocked dates" table to keep in sync.

## Bookings

Table with filters (status, payment status, date range, unit) and search (guest name / reference / phone). Detail view. Manual status override. Refund trigger (calls into the payment service — see `PAYMENT.md`).

## SEO fields exposed to the admin

Per-page meta title/description override, social share image, image alt text (pre-filled with a sensible default, editable). Deliberately **not** exposed: schema markup, canonical URLs, robots directives — those are automated so a content edit can't break them (see `SEO.md`).
