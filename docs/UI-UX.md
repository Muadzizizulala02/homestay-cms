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

Behaviour (`shared/ui/hero-slideshow`): a single photo is shown still with no controls; with two or more there is a **Pause/Play** button and one indicator per photo (auto-moving content must be pausable); it pauses while the tab is hidden; with `prefers-reduced-motion` it does not autoplay and does not fade. The next image is preloaded so the fade never shows a blank. If no slideshow is set it falls back to the single `heroImageUrl`, then to the plain tile background.

## Header and footer

The header carries only the main journey: Home, Rooms, Gallery, the language toggle and "Book a stay". **About, FAQ & house rules and Contact live in the footer** under *Information*, with *Policies* (Privacy policy, Terms and conditions; Cancellation policy appears only when written) and *Follow us* (the social links). Any footer column with nothing to show is hidden.

Privacy and Terms are CMS-managed pages (`/privacy`, `/terms`), written in English and Bahasa Malaysia in **Admin > Site content > Policies**; an empty policy hides its footer link. The starter text describes only what this website really does and is not legal advice: review it before launch. Social links are edited under **Social media** (Facebook, Instagram, TikTok, WhatsApp, YouTube, X, Other; https only, up to 8).

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
