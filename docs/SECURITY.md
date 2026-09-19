# Security

Status: partially implemented. The Firestore deny-all rule (item 1 below) already exists; everything else is planned.

## Decisions

> **Decision:** Firestore security rules deny all client access (`allow read, write: if false`); every read/write goes through the Cloud Functions API using the Admin SDK.
> **Reason:** Centralizes authorization logic in one place instead of duplicating it between Firestore rules and application code.
> **Impact:** There is no direct Firestore access path to audit for security — only the Express API surface matters.

> **Decision:** Payment status changes only on verified webhook signature, never on frontend signal. See `PAYMENT.md`.

> **Decision:** Booking creation and availability checks happen inside a single Firestore transaction. See `DATABASE.md`.

## Planned controls

- **Input validation**: Zod schema validation on every request body.
- **AuthZ**: Firebase Auth ID-token verification + `role: admin` custom-claim check in Express middleware on all `/admin/*` routes. No public registration endpoint exists.
- **Rate limiting**: Firestore-based counters (keyed by IP+email) on login and booking-create endpoints — in-memory rate limiting is unreliable because Cloud Functions instances aren't guaranteed to share memory.
- **File uploads**: Cloudinary signed uploads only; backend validates MIME type, size, and dimensions before issuing the upload signature; filenames are not trusted (regenerated server-side) to prevent path traversal; no executable file types accepted.
- **Secrets**: environment variables / Secret Manager only, never committed. `.gitignore` should additionally cover `*serviceAccount*.json` / `*firebase-adminsdk*.json` as a safety net even though no such file currently exists in the repo.
- **Error handling**: structured error responses that never leak stack traces or internal identifiers to the client.
- **Webhook verification**: Billplz `X-Signature` HMAC verified before trusting any webhook payload.

## Explicitly out of scope for v1

CSRF protection is lower priority than usual here because there are no guest sessions/cookies to forge — the public API is stateless and the admin panel uses bearer tokens (ID tokens), not cookie-based sessions. This should be revisited if session-cookie auth is ever introduced for the admin panel.
