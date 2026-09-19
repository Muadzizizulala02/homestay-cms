# UI/UX

Status: planned, not yet implemented (default Angular CLI splash page is still in place).

## Design principles

The site must read as a real, professional homestay website — not a generic AI-generated layout. Avoid: excessive gradients, random animation, too many cards, oversized whitespace, glassmorphism, fake statistics, excessive rounded containers, unnecessary UI chrome. Prioritize: clear visual hierarchy, strong photography, easy booking, clear pricing and availability, mobile-first layout, accessibility, consistent spacing, obvious (but not naggy) booking CTAs, simple navigation, trust-building information (host info, real policies, real location).

## Material usage

> **Decision:** Keep Angular Material (already installed), but replace the default M3 azure theme with a custom palette/typography suited to hospitality, and use Material primarily for functional controls (buttons, form fields, date range picker, dialogs) rather than for marketing-page layout.
> **Reason:** Raw Material defaults read as generically "Google-app-like," which is exactly the generic-AI-layout look to avoid. Hand-built layout for hero/gallery/marketing sections, with Material reserved for interactive controls, keeps the professional-but-not-templated look while still reusing the accessible, tested control components already in the dependency tree.
> **Impact:** `styles.scss`'s `mat.theme()` call needs a custom palette, not the current azure default.

## Frontend structure

See `ARCHITECTURE.md` for the full planned folder layout (`public/`, `admin/`, `shared/`, `core/`). Business logic does not live in components — data fetching and mutation go through `shared/services`, components stay presentational where practical.

## Mobile

Mobile-first, not "shrink the desktop layout": touch-friendly tap targets, a date-range picker usable on a phone, responsive image galleries, a simplified booking stepper on small screens, and a usable (not full-desktop-parity) mobile admin view for checking bookings on the go.

## Accessibility

Semantic HTML and real `<button>`s (not clickable `<div>`s), visible focus states, labeled form fields with real error messages, alt text required on all media, sufficient color contrast, keyboard-operable date picker and modals/dialogs.
