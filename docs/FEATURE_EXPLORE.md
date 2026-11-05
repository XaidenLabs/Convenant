# Feature 3 — Explore (`/explore`)

Enterprise acceptance for the public transparency surface.  
**Do not start Feature 4 (Protocol / Indexer narrative) until this checklist is green.**

## Problem this feature solves

Anyone — judges, counterparties, auditors — must inspect bonded settlements
without a wallet: who locked collateral, who won, whether BTC proof exists,
and whether a bond was released or slashed. Source of truth is the live
NEAR contract; continuous polling keeps the book fresh.

## Data rule

**Live NEAR contract views only** (shared `LiveBookPoller`).  
No seed rows, no fabricated intents. Indexer HTTP is optional scale path later.

## Scope (in)

- Continuous live book shared with Solver
- Search + lane filters (open / settling / settled / slashed)
- Selectable settlement detail (bond, quotes, path, explorers)
- Deep link `?id=` + copy share URL
- Deadline clock that does not alarm on completed/slashed archives
- Health strip: Live / Paused / Next Ns
- Empty state → Create console

## Scope (out)

- Protocol / indexer narrative → Feature 4 (`FEATURE_PROTOCOL.md`)
- Postgres / NEAR Lake → later infra
- Creator write path → Feature 1
- Solver worker commands → Feature 2
- Marketing landing rewrite → Feature 5

## Acceptance checklist

- [x] `/explore` loads intents via shared continuous live poller
- [x] Empty filter never invents rows
- [x] Selecting a row shows bond, quotes, derivation path, explorer links
- [x] Completed settlements do not scream “Deadline passed” as an active risk
- [x] `?id=` deep-links open the matching settlement
- [x] Share URL copies current selection
- [x] Health strip shows Live / Next / Refresh
- [x] `npm run build` includes `/explore`

## Primary files

- `frontend/app/explore/page.tsx`
- `frontend/hooks/useExploreConsole.ts`
- `frontend/lib/explore-ops.ts`
- `frontend/components/ExploreHealthBar.tsx`
- `frontend/components/DeadlineClock.tsx`
- `frontend/hooks/useLiveBook.ts`
- `frontend/lib/live-book-poller.ts`
