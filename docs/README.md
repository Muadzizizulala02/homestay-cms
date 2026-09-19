# HomeStay Docs

This directory is the project's long-term memory. It exists so that both the developer and any AI assistant working on this repo can pick up context without re-deriving decisions from scratch.

**Rule for maintaining this directory:** after every meaningful change, update the relevant file(s) here and add an entry to `CHANGELOG.md`. Docs must describe the actual current implementation — never features that haven't been built yet. Where something is planned but not yet built, it is explicitly marked `Status: planned`.

## Index

| File | Covers |
|---|---|
| [PROJECT-OVERVIEW.md](./PROJECT-OVERVIEW.md) | What this product is, who it's for, scope boundaries |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Stack, frontend/backend structure, hosting, integrations |
| [DATABASE.md](./DATABASE.md) | Firestore collections, fields, relationships, double-booking prevention |
| [BOOKING-FLOW.md](./BOOKING-FLOW.md) | Guest booking journey, statuses, pricing, expiry rules |
| [PAYMENT.md](./PAYMENT.md) | Payment gateway decision, server-side verification flow |
| [CMS.md](./CMS.md) | Admin dashboard scope and content model |
| [SEO.md](./SEO.md) | Page structure, automated vs. admin-editable SEO |
| [SECURITY.md](./SECURITY.md) | Security decisions and threat coverage |
| [UI-UX.md](./UI-UX.md) | Design principles, frontend folder structure |
| [API.md](./API.md) | REST endpoint surface under `/api/v1` |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | How to deploy, environment variables, hosting |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Local setup, running emulators, conventions |
| [DEV-MODE.md](./DEV-MODE.md) | Step-by-step: running the whole stack locally, testing payments, troubleshooting |
| [CHANGELOG.md](./CHANGELOG.md) | Dated log of what changed and why |

The original planning session's full output also lives at `/home/muadz/.claude/plans/homestay-cms-jaunty-galaxy.md` (outside the repo) — these docs are the in-repo, durable version of that plan, updated as implementation proceeds.
