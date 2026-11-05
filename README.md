# Covenant

**Bonded solver marketplace for NEAR Intents — real money arrives with no wallet required.**

Covenant turns competitive solver quotes into enforceable promises. Solvers lock a bond when they quote a rate. If they fail to settle within the quoted terms, the bond slashes automatically and the next solver is forced to complete the delivery. Settlement uses NEAR Chain Signatures, so real BTC lands in a non-custodial Bitcoin address with no bridge and no wrapped token.

Built for the **Real-World Money** track of the NEAR Hackathon.

> **For coding agents**: Start with [`docs/AGENT_HANDOVER.md`](docs/AGENT_HANDOVER.md). It contains the full end-to-end build instructions, interfaces, and acceptance criteria.

---

## The Problem

Cross-chain settlement today is either trusted or incomplete:

- Solvers compete on price, but nothing forces them to deliver what they quoted.
- Failures require human arbitration or refunds after the fact.
- Recipients in remittances or payroll often need wallets, seed phrases, or app downloads they do not want.

NEAR Intents + Chain Signatures can already move real assets without bridges. What is missing is **enforcement** that the solver actually does what it promised, inside the quote-to-settlement window.

## The Solution

Covenant is a bonded solver marketplace that sits on top of NEAR Intents.

1. A user posts an intent (e.g. “swap USDC on NEAR for BTC on Bitcoin”).
2. Solvers submit quotes and lock a bond in a Covenant contract.
3. The winning solver executes settlement using Chain Signatures — the contract (or controlled account) derives and signs for a real Bitcoin address.
4. If settlement matches the quoted terms and lands on time, the bond is returned plus fee.
5. If it fails, times out, or delivers worse than quoted, the bond slashes automatically and the next solver takes over.

No human dispute. No trusted middleman. The smart contract is the only thing that makes the solver honest.

**Recipient experience:** money simply arrives at a Bitcoin address they control. No NEAR wallet required on the receiving side.

## Why the Chain Is Load-Bearing

Remove the bond-slash logic or the Chain Signature verification and the system collapses into a trusted off-chain service. The blockchain is the enforcement mechanism, not a database.

---

## How It Works

```
User posts intent
        ↓
Solvers quote + lock bond (Covenant contract)
        ↓
Winning solver selected
        ↓
Solver executes via Chain Signatures (real BTC address derived & signed)
        ↓
On-chain verification of delivery
        ↓
Success → bond returned + fee
Failure → bond slashed → next solver forced to complete
```

## Auth model (important)

**No traditional login.** Covenant is not an email/password app.

- Intent creators: NEAR wallet only when signing on-chain calls
- Solvers: NEAR keys in the solver environment
- BTC recipients: **no auth at all**
- Judges offline: local stub wallet

Details: [`docs/AUTH.md`](docs/AUTH.md)

## Product surfaces

| Route | Role |
|-------|------|
| `/` | Marketing |
| `/app` | Creator console (post / select / slash) |
| `/solver` | Solver console (open book + worker commands) |
| `/explore` | Public indexed settlements |
| `/protocol` | Scalable architecture narrative |

Read path: `services/indexer` (`/v1/intents`, `/v1/stats`).  
Write path: NEAR contract. Details: [`docs/SCALABLE_ARCHITECTURE.md`](docs/SCALABLE_ARCHITECTURE.md).

## Repository layout

```
covenant/
├── packages/domain/      # Shared status/bond domain helpers
├── services/indexer/     # Scalable read API (poll NEAR → store → REST)
├── contracts/covenant/   # Rust near-sdk bonded marketplace
├── frontend/             # Next.js surfaces (create/solve/explore/protocol)
├── solver/               # Quote / settle / watch workers
├── res/covenant.wasm     # Deployable artifact
├── docker-compose.yml    # Indexer + frontend local stack
├── docs/                 # Handover, architecture, demo, auth, brand
└── .github/workflows/    # CI
```

## Quick start (local)

### Contracts

```bash
cd contracts/covenant
cargo test
cargo build --target wasm32-unknown-unknown --release
```

### Frontend

```bash
# from repo root
npm run frontend:install
npm run dev
# → http://localhost:3000

# or
cd frontend
cp .env.example .env.local   # set NEXT_PUBLIC_CONTRACT_ID when deployed
npm install
npm run dev
```

### Solver

```bash
cd solver
cp .env.example .env         # optional until live: NEAR account + keys + contract id
npm install
# Offline (no keys):
npm run dry
# Live (after deploy + keys):
npx tsx solver.ts --intent <intent_id>
```

**BTC signing:** supported — `chainsig.js` P2WPKH ↔ MPC `v1.signer-prod.testnet`.  
See [`docs/DEPLOY.md`](docs/DEPLOY.md) for the keys-vs-offline matrix.

## Demo for Judges

### Offline (no keys) — Do this / See that

**Do this:**
1. `cd frontend && npm install && npm run dev` → open the app.
2. Click **Run happy path** — then **Run slash path**.

**See that:**
- Happy: bond `Locked` → `Released`, status `Completed`, Chain Signatures path shown.
- Slash: bond `Slashed`, treasury amount increases, status `Failed`.
- Recipient never needs a NEAR wallet.

### Live (after keys) — Do this / See that

**Do this:**
1. Deploy wasm (`docs/DEPLOY.md`) and set `NEXT_PUBLIC_CONTRACT_ID` / `CONTRACT_ID`.
2. Post intent in the UI; run `npx tsx solver.ts --intent <id> --quote-only`.
3. Select winner → `--derive-only` → fund derived BTC address → `--settle-only`.
4. Second intent → **Simulate Failure** without settling.

**See that:**
- Real BTC on mempool.space/testnet; bond release/slash on nearblocks.
- MPC sign calls against `v1.signer-prod.testnet`.

Full copy-paste: [`docs/DEMO.md`](docs/DEMO.md).

### Live demo transaction links (testnet)

Contract: [`covenant-solver-mw2mng1b.testnet`](https://testnet.nearblocks.io/address/covenant-solver-mw2mng1b.testnet)

**Happy path (`covenant-1`)**
- Deploy: https://testnet.nearblocks.io/txns/5g2zfuVLh4crak8vamGCjqXeJZL9NSAwRN38kDG6Zomw
- Init: https://testnet.nearblocks.io/txns/2VqS2GYe52SLFQNfv3thbab2ekPdCSCbsKZiYTALJboh
- Intent registration: https://testnet.nearblocks.io/txns/BSymLEZVhDs6YyC52NNukoqRyG6qmSEdTFpJrtJqXpp2
- Bond lock: https://testnet.nearblocks.io/txns/HAJwfDKKsDQhKkUKe5ZewxKCaz3kc6j1bhVcqmxVLzxT
- Select winner: https://testnet.nearblocks.io/txns/F42sDPwafLeHi6wkzAJSw6jL9DHynPCLRFGxWYcApofr
- Chain Signature MPC (`v1.signer-prod.testnet`, receipt `Fht1oJbX9j9XStqPXnGzxrxW7caj2VUx4XTo6QVS4Ukc`): signing confirmed by BTC broadcast below
- Bitcoin testnet delivery: https://mempool.space/testnet/tx/b206f1bd157d16f0d645cd381ed0f84aa9abaa984973495ef2f8c7b3721f73d0
- Bond release: https://testnet.nearblocks.io/txns/3EqqRpS3hEGvF1copeSg15vqnkkSG9jnisiSJHAqmTsA

**Slash path (`covenant-2`)**
- Intent: https://testnet.nearblocks.io/txns/Hug6Ddu9A2vfCWBAeTxTTdWs9vzSv4rvvLQ6pnCp5RTe
- Bond lock: https://testnet.nearblocks.io/txns/CviDnqrt867X4a5KWKwRFNmNx5aNhJRZpy8kahxJ8uRf
- Select winner: https://testnet.nearblocks.io/txns/6H1s8piN4mD3t8UCovMK537WZUvKREaAtFeKux3pPAqf
- Bond slash: https://testnet.nearblocks.io/txns/5YknxXstSF3whRCCizzaMzVQRpCcCdVf6x3bcuPs76Fm

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for contracts, data flow, and Chain Signatures integration details.

## Brand

See [`docs/BRAND.md`](docs/BRAND.md).

**One-liner:** *The promise is enforced by the chain.*

---

## Submission Checklist

- [ ] Working prototype (NEAR testnet + Bitcoin testnet)
- [ ] Public repository
- [ ] Demo post on X tagging @NEARProtocol with #NEARHackathon
- [ ] README written for both humans and AI judges (“do this, see that”)
- [ ] Tracks: `realworld` (primary)

**Covenant** — the promise is enforced by the chain.
