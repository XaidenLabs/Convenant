# Feature 2 — Solver console (`/solver`)

Enterprise acceptance for the solver surface.  
**Do not start Feature 3 until this checklist is green.**

## Data rule

**Live NEAR contract views only.**  
No seed rows, no session mocks, no fabricated intents.

Contract default: `covenant-solver-mw2mng1b.testnet`

## Scope (in)

- Live order book (open / settling / terminal)
- Search + lane filters
- Selected intent detail (bond, path, quotes, BTC proof link)
- Settlement pipeline checklist from live status
- Copyable worker commands (quote / derive / settle / watch)
- Health bar with last live fetch time, next-poll countdown, RPC errors
- Shared continuous LiveBookPoller (8s base cadence, backoff on errors, pause when tab hidden, keep last good snapshot)
- Explore + Solver share one in-flight NEAR fetch loop
- Hardened `solver/scripts/watch-intents.ts` (`--once`, JSON logs)

## Scope (out)

- Public explore polish → Feature 3 (`FEATURE_EXPLORE.md`)
- Indexer Postgres → later infra
- Create console → Feature 1 (done)

## Acceptance checklist

- [x] `/solver` loads intents via `fetchLiveBook()` (NEAR RPC)
- [x] Empty book shows empty state — never invents rows
- [x] Selecting an intent shows live quotes + bond + derivation path
- [x] Worker command blocks copy the selected intent id
- [x] Watcher defaults to the live contract id
- [x] Indexer seed script clears cache (no dummy seed)
- [x] Continuous managed polling via `live-book-poller` (shared by `/solver` + `/explore`)
- [x] Health bar shows Live / Paused / Next Ns + Refresh now
- [x] `npm run build` includes `/solver`

## Primary files

- `frontend/app/solver/page.tsx`
- `frontend/app/explore/page.tsx`
- `frontend/hooks/useSolverConsole.ts`
- `frontend/hooks/useLiveBook.ts`
- `frontend/lib/live-book.ts`
- `frontend/lib/live-book-poller.ts`
- `frontend/lib/solver-ops.ts`
- `frontend/components/SolverHealthBar.tsx`
- `frontend/components/CopyCommand.tsx`
- `solver/scripts/watch-intents.ts`
- `solver/lib/config.ts`
