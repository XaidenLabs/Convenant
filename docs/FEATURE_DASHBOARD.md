# Dashboard shell (sidebar + top bar)

Product surfaces use a real dashboard chrome — not a marketing header.

## Shell

- **Left sidebar** — Overview, Create, Solve, Explore, Protocol
- **Top bar** — current page title + actions (wallet / + New intent)
- **Main canvas** — page content in `DashboardFrame` + `DashPanel`
- Landing keeps `MarketingNav`; gold **Dashboard** CTA → `/dashboard`

## Overview (`/dashboard`)

Sweet live pulse: metrics, recent settlements (latest 5 + View more), quick actions.

## Lists

`PreviewList` — latest **5**, View more opens a modal for the full set.

## Acceptance

- [x] Sidebar + top bar on all product pages
- [x] `/dashboard` overview with live stats
- [x] Landing CTA enters `/dashboard`
- [x] `npm run build` green
