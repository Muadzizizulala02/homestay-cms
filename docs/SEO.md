# SEO Strategy

Status: the page structure below is live. Per-page `<title>`/meta description is implemented (`core/seo.service.ts`). Sitemap, robots.txt, canonical tags, structured data, and Open Graph tags are still planned — deliberately deferred to the dedicated SEO/performance phase rather than half-built alongside the page content.

## Page structure and rationale

| Page | Route | Status | Why |
|---|---|---|---|
| Home | `/` | ✅ live | SEO anchor + conversion page |
| Accommodation (list + detail) | `/accommodation`, `/accommodation/:slug` | ✅ live | Each unit type gets its own indexable page, ranking for its own long-tail keywords, instead of one thin combined page |
| Gallery | `/gallery` | ✅ live | Distinct browsing intent from per-room photos |
| About & Location | `/about` | ✅ live | Merged — a single-property site rarely has enough distinct content to justify two separate thin pages; carries the local-SEO content (address, key-free Google Maps embed) |
| FAQ & House Rules | `/faq` | ✅ live | Merged — both are policy/reference content read at the same decision point; natural home for `FAQPage` structured data once that's built |
| Contact | `/contact` | ✅ live (info only — no submission form yet, see below) | Distinct intent (direct question), kept separate deliberately |
| Booking flow | `/booking/*` | ⏳ planned | Transactional, not content — will be `noindex`, reached via CTA, not in primary nav |
| Booking lookup | `/booking/lookup` | ⏳ planned | `noindex` |

Deliberately not separate pages: a standalone Facilities/Amenities page (amenities are a property of each room, folded into Accommodation + Home highlights) and a standalone Booking marketing page (the flow itself is "the page").

**Contact page scope note**: since there's no backend email-sending service yet (planned for the notifications phase), Contact shows email/phone/WhatsApp/address/social links rather than a submission form that would have nowhere to actually deliver a message — a form with no working backend would be worse than no form.

**Nearby attractions**: not a separate `siteSettings` field — folded into the free-text `aboutContent` the admin already edits, rather than adding a dedicated field/UI for one more small piece of content.

## Automated (no admin involvement)

**Implemented**: per-page `<title>` and meta description (`SeoService.setPage()`, called from every public page's `ngOnInit`), a real 404 page (`noindex`ed via `SeoService.setNoIndex()`), semantic HTML and heading hierarchy in every template, alt-text required (not optional) on every media upload (enforced by `recordMediaSchema` — `altText: z.string().min(1)`).

**Still planned**: canonical URLs, sitemap.xml (generated from known routes + accommodation slugs), robots.txt, `noindex` on `/booking/*` and `/admin/*` (no `/booking/*` routes exist yet to tag), `LocalBusiness`/`Hotel` + `FAQPage` JSON-LD generated from `siteSettings`/FAQ data (never hand-authored by the admin), Open Graph + Twitter Card tags derived from each page's title/description/share image.

## Admin-editable

Per-page SEO title/description override, social share image, image alt text (pre-filled, editable).

> **Decision:** Schema markup, canonical tags, and robots directives are never exposed to the admin.
> **Reason:** These are easy to break by accident through a content edit and provide no day-to-day value to the admin.
> **Impact:** They stay fully code-driven.

## Local SEO

Address lives in `siteSettings` and feeds the visible About page (✅ implemented — a key-free Google Maps embed, `https://www.google.com/maps?q=<address>&output=embed`, so no Maps API key/billing is required for this basic embed). `geo` (lat/lng) exists on the type for future structured-data use but has no editing UI yet and isn't consumed by anything yet. `LocalBusiness` structured data generated from this same data is still planned.
