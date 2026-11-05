# Covenant — Scalable Architecture

This is the edge beyond a two-page demo: role-separated surfaces, a scalable
**read path**, and an on-chain **write path** that remains the source of truth.

## Problem

Solver quotes on remittance / payroll routes are cheap talk unless collateral
and destination delivery are enforced. Recipients should not need a NEAR wallet.

## System map

```
Surfaces (Next.js)
  /           marketing
  /app        creator console (write via wallet)
  /solver     solver console (worker UX)
  /explore    public indexed explorer (read)
  /protocol   architecture narrative

Read path
  Indexer service (:8787)
    → polls NEAR view methods
    → persists intents/quotes (file store now; Postgres-shaped API)
    → serves /v1/intents, /v1/stats

Write path
  NEAR Covenant contract
    → post_intent / submit_quote / select_winner
    → submit_settlement_proof / slash_and_handover

Settlement workers
  solver/ scripts + watch loop
    → Chain Signatures MPC (v1.signer-prod.testnet)
    → native Bitcoin testnet broadcast
```

## Why this scales better than RPC-only UI

| Concern | Naive demo | Covenant stack |
|---------|------------|----------------|
| List 10k intents | N contract views from browser | Indexed query + filters |
| Multiple UIs | Duplicate RPC logic | Shared indexer API |
| Solver bots | Scrape UI | Same `/v1/intents?status=Open` |
| Storage growth | Session storage | Durable indexer store |
| Chain load | Every refresh hits NEAR | Poll interval + cache |

## Auth (still not a login app)

See `docs/AUTH.md`. Scalability does not require user accounts — it requires
indexed reads and keyed writes.

## Local stack

```bash
# terminal 1 — indexer (clears local cache, then syncs live chain)
npm run indexer:install
npm run indexer:seed    # wipe only — no dummy rows
npm run indexer:dev     # continuous chain sync → :8787

# terminal 2 — frontend
npm run frontend:install
NEXT_PUBLIC_INDEXER_URL=http://127.0.0.1:8787 npm run dev
```

Or `docker compose up`.

`/protocol` continuously polls indexer `/health` + `/v1/stats`. If the
indexer is down, it falls back to the shared live NEAR book for stats.

## Indexer API (Feature 4)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Online, sync metadata, poll cadence |
| GET | `/v1/meta` | Health + stats + endpoint list |
| GET | `/v1/stats` | Aggregate protocol stats |
| GET | `/v1/intents` | Filtered intent list |
| GET | `/v1/intents/:id` | Intent + quotes |
| POST | `/v1/sync` | Manual chain re-sync |

## Next production upgrades (deliberate)

1. Replace file store with Postgres + migrations
2. NEAR Lake / event receipts instead of view polling
3. Horizontal solver workers with job queue (NATS / SQS)
4. Light-client style BTC proof verification on-chain
