# UI/UX

Status: the public website (Home, Rooms, Room detail, Booking, Gallery, About, FAQ, Contact) uses the "town stay" design system below, in English and Bahasa Malaysia. The admin area keeps Angular Material.

## Design principles

The site must read as a real, professional homestay website — not a generic AI-generated layout. Avoid: gradient washes, random animation, grids of identical rounded cards, glassmorphism, fake statistics, tracked-out ALL-CAPS labels above every heading. Prioritize: clear visual hierarchy, strong photography, easy booking, clear pricing and availability, mobile-first layout, accessibility, consistent spacing, obvious (but not naggy) booking CTAs, trust-building information (real policies, real location).

The layout is inspired by the structure of resort-booking sites such as TNB Holiday (hero with a booking bar, notices, facilities, house rules, how-to-book steps) but uses its own identity — no third-party branding, copy or imagery.

## Design tokens (`src/styles.scss`)

| Token | Value | Use |
|---|---|---|
| `--ink` | `#14343a` | text, dark surfaces (footer, notice strip) |
| `--plaster` | `#f2f4f1` | page background (cool grey-green, not cream) |
| `--paper` | `#ffffff` | inputs, booking bar, header |
| `--mist` | `#dce6e3` | borders, empty image placeholders |
| `--moss` | `#3e7a6b` | icons, list markers |
| `--kunyit` / `--kunyit-deep` | `#e9a91d` / `#c98d0b` | the one action colour (buttons, active nav underline, step rules). Dark ink text on it. |

Fonts: **Bricolage Grotesque** for headings, **Public Sans** for body (Google Fonts in `index.html`). Shared classes: `.page`, `.page-title`, `.prose`, `.btn`, `.btn-quiet`, `.field`/`.input`.

The one memorable element is the **hero booking bar** (`shared/ui/booking-bar`): check-in, check-out, guests and a live night count, overlapping the hero's lower edge. It sends `checkIn`, `checkOut`, `guests` query params to `/accommodation`, which carries them to the room detail and booking pages.

## Hero slideshow

The home hero cross-fades through the photos listed in **Admin > Site content > Hero slideshow** (up to 10), showing each for the configured **seconds per photo** (2-30, default 5). Admins upload several photos at once (straight to Cloudinary, folder `homestay/hero`), add from the gallery or by https address, reorder with Move up/down, and remove. The first photo doubles as the social-share image unless that was set separately.

Behaviour (`shared/ui/hero-slideshow`): a single photo is shown still with no controls; with two or more, **nothing is drawn over the photo**. Moving content must still be pausable, so one Pause/Play button exists for keyboard and screen-reader users: it is invisible until it receives focus, then appears bottom-right. It pauses while the tab is hidden; with `prefers-reduced-motion` it does not autoplay, does not fade and does not zoom. Each photo cross-fades (800 ms) while drifting slowly closer (a gentle zoom that resets only after the photo has faded out). The next image is preloaded so the fade never shows a blank. If no slideshow is set it falls back to the single `heroImageUrl`, then to the plain tile background.

## Favicon and app icon

The "HS" monogram set lives in `public/` (served at the site root): `favicon.ico`, 16/32 px PNGs, `apple-touch-icon.png`, 192/512 px Android icons and `site.webmanifest` (name "Homestay", theme colour `#14343a`). `index.html` links them all and sets `theme-color`. To change the icon, replace those files with a new set from the same generator and keep the names.

## Home page sections

Each home section has its own layout and background, so the page reads as a sequence of different spaces rather than one repeated card style (components in `public/home/sections/`):

| Section | Look | Where |
|---|---|---|
| Rooms | image-led list, first room large | plaster page |
| What you can count on | light **mist band**: heading + mosaic motif on the left, **icon tiles** on the right that flip to dark ink with a gold icon on hover | `home-facilities` |
| How booking works | white band, a **journey**: four numbered nodes joined by a gold line that draws itself as it scrolls in (a vertical timeline on phones), ending in a "Start with your dates" button | `home-steps` |
| House rules | dark **photo section** with icon cards | `policy-showcase` |
| About the stay | **editorial**: a large lead sentence behind a gold rule, the remainder below, the host's note as a speech card, and a framed photo with an offset gold block | `home-about` |

**Optional background photo per section.** In Admin > Site content > *Home page backgrounds* the owner can put a photo behind *What you can count on*, *How booking works*, *House rules* and *About the stay* (upload, pick from the gallery, or paste an https address; Remove returns to the default). With no photo each section keeps the design in the table above; with one it gets a dark scrim and light text (step nodes turn pale, tiles and the host card stay white) so it stays readable. *House rules* uses the first hero photo until the owner picks one. Stored as `siteSettings.sectionBackgrounds` (`facilities`, `steps`, `rules`, `about`; empty = default). Background addresses are escaped by `shared/ui/css-url.ts`, so a stray quote can never inject CSS.

The full-bleed sections sit flush against each other (no gap between the facilities band, the booking steps, the house rules and About).

The About text is split by `about-text.ts` (first paragraph, or first sentence, becomes the lead); the photo is the second hero photo; with no photo, host note or body text the section simply simplifies. A section with nothing to show (no facilities) is omitted; the booking steps are always shown. Everything is translated and respects `prefers-reduced-motion` (nodes and lines are simply shown).

## Policy sections (Privacy, Terms, house rules)

One component, `shared/ui/policy-showcase`, renders them all: a full-width section over a dark scrim on the hero photo, a centred small tracked label ("Our policy" / "House rules"), the title, a subtitle and an italic quote, then rounded cream **cards** of items, each with a ringed icon, a heading and a short description. Items are laid out as two side-by-side cards (the left takes an odd item), with anything past eight in a full-width card beneath; on phones the cards stack.

The admin writes plain text; `policy-parse.ts` turns it into items: blank-line separated blocks, where a short first line without a closing full stop becomes the heading and the rest the description (free-form text without headings still renders as readable cards). Icons are picked from keywords in the heading, English and Malay (payments, bookings, guests, cancellation, smoking, noise...), falling back to a generic one, using only long-standing Material icon names. House rules are single sentences, so each becomes a heading-only item. Used on `/privacy`, `/terms` (as the whole page, flush under the header), the home page rules section and the FAQ page's house rules. An unpublished policy shows a short "not published yet" message instead.

## Header and footer

The header carries only the main journey: Home, Rooms, Gallery, the language toggle and "Book a stay". **About, FAQ & house rules and Contact live in the footer** under *Information*, with *Policies* (Privacy policy, Terms and conditions; Cancellation policy appears only when written) and *Follow us* (the social links). Any footer column with nothing to show is hidden.

Privacy and Terms are CMS-managed pages (`/privacy`, `/terms`), written in English and Bahasa Malaysia in **Admin > Site content > Policies**; an empty policy hides its footer link. The starter text describes only what this website really does and is not legal advice: review it before launch. Social links are edited under **Social media** (Facebook, Instagram, TikTok, WhatsApp, YouTube, X, Other; https only, up to 8).

## Motion

One vocabulary, defined in `styles.scss`: things **rise ~20 px and fade in over ~0.6 s** on an ease-out curve (`@keyframes rise-in`, `.reveal`); hover/focus changes take 0.15-0.3 s. All of it is switched off under `prefers-reduced-motion` (content is simply shown).

- **Home hero typing (`shared/ui/hero-typing`):** the headline and intro line type themselves in a **constant loop**: type, hold ~5 s so it can be read, erase, rest, repeat. It is a pure function of time (`typing-logic.ts`, unit-tested), the untyped remainder stays in the same text flow (invisible) so lines never re-wrap or shift the layout, and the complete text is always present for screen readers and crawlers (the animated copy is `aria-hidden`). It pauses while the tab is hidden, restarts when the language changes, and under `prefers-reduced-motion` shows the full text with no caret. The booking bar rises in after it starts.
- **Scroll reveal:** `appReveal` (`shared/ui/reveal`) fades sections into place the first time they scroll into view; list items stagger with `[appReveal]="index * 90"`. It never leaves anything hidden: no IntersectionObserver or reduced motion = shown immediately. Used on the home page sections, facilities, steps, rooms.
- **Rooms page:** the title draws a turmeric rule under itself, the dates summary slides in from the side, each room fades up as it scrolls into view, photos ease in once loaded (`appImgFade`) and settle from a slight zoom, and on hover the photo zooms, the text nudges and the name's underline thickens.
- **Pages:** every `.page` settles in when it appears; route changes cross-fade the content area with the router's View Transitions (`withViewTransitions()`; the header has its own `view-transition-name` so it stays put). Rooms list rows and gallery tiles rise in one after another; booking steps ease in.
- **Hover / focus:** room and gallery photos zoom slowly inside their frame; nav links get a sliding underline; buttons lift 1 px; footer and "see all" links ease their underline; step numbers and facility icons nudge.
- **Overlays:** the mobile menu fades/slides open (`visibility`, so closed links are not focusable); the important-notice popup and its backdrop fade and rise in (`@starting-style`); FAQ answers ease open (`::details-content`, Chromium 131+, instant elsewhere).

## Notices

Admins manage notices in **Admin → Site content**. Ordinary active notices show in a slim strip under the header (dismissible); notices marked *important* also open once per browser session in a pop-up. Dismissals live in `sessionStorage` (`shared/ui/notices`).

## Language (English / Bahasa Malaysia)

- **UI labels** live in `src/app/shared/i18n/translations/*.ts` (one file per page area, keys prefixed by area) and are read with `I18nService.t('key')`. The header toggle switches language; the choice is remembered in `localStorage` and defaults to the browser language (`ms*` → Malay, otherwise English). A missing Malay key falls back to English, then to the key itself so a gap is visible.
- **Admin-written content** is translated in the content: `siteSettings.translations.ms` holds Malay versions of the headline, subheadline, about, host intro, cancellation policy, house rules and FAQs; notices and facilities carry optional `titleMs`/`bodyMs`/`labelMs`/`descriptionMs`; rooms carry optional `descriptionMs`. Anything left blank falls back to English (`shared/i18n/localize.ts`, unit-tested in `localize.spec.ts`). Room names, prices and amenities are not translated.
- Page `<title>`/description follow the active language. There are no per-language URLs yet, so search engines see one canonical (English-first) page.

## Loading states

Every page that fetches data shows **skeletons** (grey placeholders shaped like the real content) instead of a blank page, so nothing jumps when data arrives. The shared piece is `shared/ui/skeleton` (`<app-skeleton [lines] width height ratio>`), styled by `.skeleton` in `styles.scss`: a soft shimmer that the global `prefers-reduced-motion` rule switches off. Skeleton colours can be overridden per context with `--skeleton-bg` / `--skeleton-sheen` (used on the dark hero and footer).

Conventions, applied to the home, rooms, room detail, booking, gallery, About, FAQ and Contact pages and to the admin dashboard, bookings, accommodation, media and content screens:
- The skeleton mirrors the page's real layout (same image ratios and block sizes).
- Each loading region has `aria-busy="true"` and one visually-hidden `role="status"` "Loading…" line (translated on the public site); the skeleton itself is `aria-hidden`.
- An **empty-state message appears only after loading has finished** (no "No rooms yet" flash); a failed load shows a retry message instead of a skeleton forever.
- The header and footer show a skeleton for the homestay name until site settings arrive.

## Material usage

Public pages are hand-built semantic HTML/SCSS using the tokens above. Angular Material is used only for the admin area (forms, dialogs, toolbars, tables) and for the icon font (`<mat-icon>`) in the facilities list. `mat.theme()` in `styles.scss` still styles the admin.

## Frontend structure

See `ARCHITECTURE.md` for the folder layout. Business logic does not live in components — data goes through `shared/services`; site content is loaded once for the whole visit by `SiteContentService` and exposed already localized.

## Mobile

Mobile-first: the nav collapses behind a "Menu" button below 960px, the booking bar stacks into two columns, grids reflow rather than needing separate breakpoint rules, and images are lazy-loaded.

## Accessibility

Semantic HTML and real `<button>`s, a skip-to-content link, visible `:focus-visible` outlines, labelled form fields with real error messages, alt text on media, native `<dialog>` for the notice pop-up and `<details>` for the FAQ, `prefers-reduced-motion` respected, the language toggle announces its target language.
