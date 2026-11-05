# Feature 4 — Protocol / Indexer (`/protocol`)

Enterprise acceptance for the architecture + scalable read-path surface.  
**Do not start Feature 5 (Landing rewrite) until this checklist is green.**  
Feature 5 lives in `docs/FEATURE_LANDING.md`.

## Problem this feature solves

Judges and agents need a single place that explains how Covenant scales:
role-separated surfaces, chain as write truth, indexer as scalable reads,
Chain Signatures for native BTC, and wallet-only auth. The page must also
prove the indexer is real — live health, sync cadence, and stats from chain.

## Data rule

Indexer store is **chain-synced only** (no dummy seed rows).  
Protocol UI polls indexer health/stats continuously; if the indexer is down,
stats fall back to the shared live NEAR book poller.

## Scope (in)

- Enterprise `/protocol` narrative (surfaces / read / write / auth)
- Live indexer health strip (online / syncing / offline + next poll)
- Live protocol stats (intents, open, completed, slashed, locked bond)
- Manual “Sync now” against `POST /v1/sync` when indexer is up
- Hardened indexer health payload + parallel chain sync
- Docs checklist

## Scope (out)

- Postgres / NEAR Lake migration (documented next step only)
- Marketing landing rewrite → Feature 5
- Create / Solve / Explore feature work (done)

## Acceptance checklist

- [x] `/protocol` explains surfaces, read path, write path, auth
- [x] Health strip shows indexer online/offline with continuous refresh
- [x] Stats reflect live chain-synced data (or live-book fallback)
- [x] Sync now triggers indexer re-sync when reachable
- [x] Indexer seed path clears store only — never invents rows
- [x] Indexer `/health` exposes sync metadata
- [x] `npm run build` includes `/protocol`
- [x] Indexer `npm run typecheck` passes

## Primary files

- `frontend/app/protocol/page.tsx`
- `frontend/hooks/useProtocolConsole.ts`
- `frontend/components/ProtocolHealthBar.tsx`
- `frontend/lib/indexer.ts`
- `services/indexer/src/server.ts`
- `services/indexer/src/sync.ts`
- `docs/FEATURE_PROTOCOL.md`
- `docs/SCALABLE_ARCHITECTURE.md`
