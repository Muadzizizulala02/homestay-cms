# SEO Strategy

Status: planned, not yet implemented.

## Page structure and rationale

| Page | Route | Why |
|---|---|---|
| Home | `/` | SEO anchor + conversion page |
| Accommodation (list + detail) | `/accommodation`, `/accommodation/:slug` | Each unit type gets its own indexable page, ranking for its own long-tail keywords, instead of one thin combined page |
| Gallery | `/gallery` | Distinct browsing intent from per-room photos |
| About & Location | `/about` | Merged — a single-property site rarely has enough distinct content to justify two separate thin pages; carries the local-SEO content (address, map, nearby attractions) |
| FAQ & House Rules | `/faq` | Merged — both are policy/reference content read at the same decision point; natural home for `FAQPage` structured data |
| Contact | `/contact` | Distinct intent (direct question) + form, kept separate deliberately |
| Booking flow | `/booking/*` | Transactional, not content — `noindex`, reached via CTA, not in primary nav |
| Booking lookup | `/booking/lookup` | `noindex` |

Deliberately not separate pages: a standalone Facilities/Amenities page (amenities are a property of each room, folded into Accommodation + Home highlights) and a standalone Booking marketing page (the flow itself is "the page").

## Automated (no admin involvement)

Canonical URLs, sitemap.xml (generated from known routes + accommodation slugs), robots.txt, clean slugged URLs, `noindex` on `/booking/*` and `/admin/*`, heading hierarchy and semantic HTML in templates, alt-text required (not optional) on every media upload, `LocalBusiness`/`Hotel` + `FAQPage` JSON-LD generated from `siteSettings`/FAQ data (never hand-authored by the admin), Open Graph + Twitter Card tags derived from each page's title/description/share image, a real 404 page.

## Admin-editable

Per-page SEO title/description override, social share image, image alt text (pre-filled, editable).

> **Decision:** Schema markup, canonical tags, and robots directives are never exposed to the admin.
> **Reason:** These are easy to break by accident through a content edit and provide no day-to-day value to the admin.
> **Impact:** They stay fully code-driven.

## Local SEO

Address/phone/geo-coordinates live in `siteSettings` and feed both the visible About page and the structured data. Nearby-attractions list is admin-editable free text (avoids keyword-stuffing pressure by design — no keyword-density tooling is provided). Embedded Google Map on About and Contact.
