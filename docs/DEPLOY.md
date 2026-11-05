# Covenant deploy notes

## Live status

| Component | Status |
|-----------|--------|
| Contract on NEAR testnet | ✓ `covenant-solver-mw2mng1b.testnet` |
| Happy path (intent→quote→Chain Sig BTC→proof→release) | ✓ intent `covenant-1` |
| Slash path on-chain | ✓ intent `covenant-2` |
| Explorer links in README / DEMO | ✓ |
| GitHub push | ✓ via Cursor GitHub App |

See `docs/DEMO.md` § Live transaction links.

## Offline status (still useful)

| Component | Offline | Needs keys / funds |
|-----------|---------|---------------------|
| Contract unit tests + wasm | ✓ | Deployed |
| Frontend happy + slash click paths (local stub) | ✓ | Live wallet + contract id |
| Solver `--dry-run --mock` | ✓ | — |
| Solver `--derive-only` | egress only | Private key **not** required for known MPC |
| Solver MPC sign + BTC broadcast | ✓ live | ★ NEAR key + gas + BTC faucet on derived address |
| `submit_quote` / `submit_settlement_proof` | ✓ live | ★ NEAR key |
| GitHub push | ✓ | Cursor GitHub App |

## BTC signing support status

**Supported.** `chainsig.js` documents Bitcoin mainnet + testnet **P2WPKH** via `chainAdapters.btc.Bitcoin`.  
Testnet MPC: `v1.signer-prod.testnet` (NEAR docs + near-multichain examples).  
Default mempool API in solver: `https://mempool.space/testnet4/api` (override with `MEMPOOL_API`).

## Blockers for live demo

1. NEAR testnet account + keys (`NEAR_ACCOUNT_ID`, `NEAR_PRIVATE_KEY`).
2. `near` CLI (or equivalent) to deploy `./res/covenant.wasm`.
3. Bitcoin testnet faucet funds on the derived address for path `covenant-{intent_id}`.
4. ~~GitHub push~~ — connected via Cursor GitHub App.

## Deploy checklist (copy-paste when keys arrive)

```bash
# 1. Deploy contract
near deploy <account.testnet> ./res/covenant.wasm \
  --initFunction new \
  --initArgs '{"treasury":"<treasury.testnet>"}' \
  --networkId testnet

# 2. Point apps at it
echo "NEXT_PUBLIC_CONTRACT_ID=<account.testnet>" >> frontend/.env.local
echo "CONTRACT_ID=<account.testnet>" >> solver/.env
echo "NEAR_ACCOUNT_ID=<solver.testnet>" >> solver/.env
echo "NEAR_PRIVATE_KEY=ed25519:..." >> solver/.env

# 3. Frontend
cd frontend && npm run dev

# 4. Solver quote → UI select → derive/fund → settle
cd solver
npx tsx solver.ts --intent <id> --quote-only
npx tsx solver.ts --derive-only --intent <id>
# fund printed address, then:
npx tsx solver.ts --intent <id> --settle-only

# 5. Slash demo: second intent → quote → select → Simulate Failure in UI

# 6. Paste explorer links into README.md and docs/DEMO.md
```

## Env reference

See `solver/.env.example` and `frontend/.env.example`.
