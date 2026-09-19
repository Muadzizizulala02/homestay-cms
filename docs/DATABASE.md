# Database Design (Firestore)

Status: types and the booking transaction logic are implemented and tested (`functions/src/types/`, `functions/src/services/booking.service.ts`); no data has been written by real traffic yet since no HTTP routes call this service.

## Collections

### `siteSettings/main` (singleton)
All admin-editable site copy and configuration: hero content, headline/intro, about copy, host intro, location/address/geo-coordinates, contact info, social links, check-in/out times, house rules, FAQ items (ordered array), cancellation/refund policy text, legal page content, SEO defaults, social share image.

### `accommodations/{id}`
One document per room/unit type: `slug`, `name`, `description`, `photos[]`, `capacity`, `beds`, `amenities[]`, `basePrice`, `seasonalRates[]` (day-of-week or date-range overrides), `minStay`, `maxStay`, `active`.

Subcollection **`accommodations/{id}/availability/{YYYY-MM-DD}`** — one document per night. This is the core of the double-booking prevention design (see below): `status: booked | blocked`, `bookingId`.

### `bookings/{id}`
`reference` (human-readable, e.g. `BK-20260919-XXXX`), guest name/email/phone, `accommodationId`, `checkInDate`, `checkOutDate`, `guestCount`, price breakdown (nights, rate lines, total), `status`, `paymentStatus`, `notes`, `createdAt`.

### `payments/{id}`
`bookingId`, gateway bill ID, amount, method, `status`, raw webhook payload (kept for audit), timestamps.

### `media/{id}`
Cloudinary public ID, URL, alt text (required field, not optional), association (`gallery` or a specific `accommodationId`), display order.

**Deliberately not included:** `users`/`guests` (no guest accounts), `reviews` (not in v1 scope), a multi-owner `properties` collection (this is one homestay, not a marketplace) — see `PROJECT-OVERVIEW.md`.

## Double-booking prevention

> **Decision:** Represent each night of each accommodation as its own Firestore document (`availability/{date}`), and create a booking inside a single Firestore transaction that touches every date document plus the booking document.
> **Reason:** Firestore has no SQL-style row locks, but `Transaction.create()` fails the *entire* transaction if the target document already exists — that precondition is checked atomically at commit time on the server. Modeling one night = one document turns "is this date range free" into a set of document-existence preconditions Firestore enforces natively, with no manual mutex or external locking service.
> **Impact:** `createBooking()` (`functions/src/services/booking.service.ts`) reads the accommodation doc, computes the price and the list of nights, then calls `transaction.set()` on the new booking doc and `transaction.create()` on every night's availability doc, all in one transaction. If any night is already taken, the transaction rejects as a whole (surfaced as a 409 `DATES_UNAVAILABLE` `AppError`) and nothing is written — not even the booking doc. Verified in `booking.service.test.ts` by firing two overlapping `createBooking()` calls concurrently and asserting exactly one succeeds.

## Pending-hold expiry

A `pending_payment` booking holds its dates for 20 minutes (`HOLD_DURATION_MS` in `booking.service.ts`). `expireStalePendingBookings()` finds bookings whose `holdExpiresAt` has passed, flips them to `expired`, and deletes their availability docs in a transaction so abandoned checkouts don't permanently lock inventory. **Implemented and tested**, but not yet wired to a Cloud Scheduler trigger — that export gets added to `index.ts` when the booking flow goes live end-to-end (Phase 6/7), since there's no real traffic to sweep before then.

## Indexes

- `bookings` composite index on `status` + `holdExpiresAt` — **added** to `firestore.indexes.json`, required by `expireStalePendingBookings()`.
- `bookings` composite index on `status` + `createdAt` (admin filtering/sorting) — planned, will be added alongside the admin bookings-list route.
- `bookings` index on `checkInDate` (the "mark completed after checkout" sweep) — planned, will be added alongside that sweep's implementation.

## Server-side-only invariants

- Pricing (nightly rate × nights + seasonal adjustments) is always computed server-side from the `accommodations` document at booking time — the client-submitted total is never trusted.
- Min/max stay is enforced server-side at booking creation, not just in the UI.
- All timestamps are stored in UTC; displayed in Asia/Kuala_Lumpur (MYT, no DST) throughout the UI and emails.
