# UI/UX

Status: the public website (Home, Accommodation, Gallery, About, FAQ, Contact) and the admin dashboard/forms are implemented. The default Angular CLI splash page is gone.

## Design principles

The site must read as a real, professional homestay website — not a generic AI-generated layout. Avoid: excessive gradients, random animation, too many cards, oversized whitespace, glassmorphism, fake statistics, excessive rounded containers, unnecessary UI chrome. Prioritize: clear visual hierarchy, strong photography, easy booking, clear pricing and availability, mobile-first layout, accessibility, consistent spacing, obvious (but not naggy) booking CTAs, simple navigation, trust-building information (host info, real policies, real location).

## Material usage

> **Decision:** Keep Angular Material (already installed), but replace the default M3 azure theme with a custom palette/typography suited to hospitality, and use Material primarily for functional controls (buttons, form fields, date range picker, dialogs) rather than for marketing-page layout.
> **Reason:** Raw Material defaults read as generically "Google-app-like," which is exactly the generic-AI-layout look to avoid. Hand-built layout for hero/gallery/marketing sections, with Material reserved for interactive controls, keeps the professional-but-not-templated look while still reusing the accessible, tested control components already in the dependency tree.
> **Impact:** ✅ `styles.scss`'s `mat.theme()` now uses `mat.$orange-palette` (warm terracotta) instead of azure, and headings across the site use a serif display face ('Fraunces', loaded via Google Fonts in `index.html`) while body text stays Roboto — a small but deliberate signal that this isn't a stock Material app shell. The public pages (`public/*`) are hand-built semantic HTML/SCSS as planned; Material is used for admin forms/dialogs/toolbars where its accessible form controls carry real value.

## Frontend structure

See `ARCHITECTURE.md` for the full folder layout (`public/`, `admin/`, `shared/`, `core/`). Business logic does not live in components — data fetching and mutation go through `shared/services`, components stay presentational where practical.

## Mobile

Mobile-first, not "shrink the desktop layout": the public nav collapses to a hamburger menu below 720px (`public-layout`), image grids use `auto-fit`/`auto-fill` so they reflow naturally rather than needing separate breakpoint rules, and gallery images are lazy-loaded (`loading="lazy"`). Not yet built: a date-range picker (no booking flow exists yet) and a mobile-specific admin view beyond what Material's responsive components already provide.

## Accessibility

Semantic HTML and real `<button>`s (not clickable `<div>`s), visible focus states, labeled form fields with real error messages, alt text required on all media, sufficient color contrast, keyboard-operable date picker and modals/dialogs.
