# Covenant Demo Guide

Written for human judges and AI judges (Claude Code, Codex).  
Two modes: **offline stub** (no keys) and **live testnet** (keys + deploy).

---

## A. Offline walkthrough (no NEAR / BTC keys)

Use this before deploy to verify both product paths click cleanly.

### Prerequisites

```bash
cd frontend && npm install && npm run dev
# open http://localhost:3000
```

Contract does not need to be deployed. The UI auto-enters **local stub mode**.

### Happy path — Do this / See that

**Do this:**
1. Open the Covenant app.
2. Click **Run happy path (intent → bond release)**  
   *or* manually: Post intent → **+ Demo solver quote** → **Select winner** → **Trigger settlement**.

**See that:**
- Bond badge moves: `None` → (after select) `Locked` → (after settle) `Released`.
- Intent status ends at `Completed`.
- A Bitcoin tx link appears (placeholder hash offline).
- Chain Signatures path `covenant-{intent_id}` is shown.
- Recipient address never required a NEAR wallet.

### Slash path — Do this / See that

**Do this:**
1. Click **Run slash path (intent → Simulate Failure)**  
   *or* manually: Post intent → quote → select winner → **Simulate Failure**.

**See that:**
- Bond badge becomes `Slashed` (or re-opens if another quote remains).
- Intent status becomes `Failed` (or `Quoted` after handover).
- “Slashed to treasury” increases.
- No human arbitration step.

### Solver dry-run (offline)

```bash
cd solver
npm install
npx tsx solver.ts --dry-run --mock --intent covenant-demo-1
```

**See that:** planned steps for derive → fund → MPC sign → broadcast → proof, with clear ★ markers for key-gated steps.  
BTC signing status printed: **YES (P2WPKH via chainsig.js ↔ v1.signer-prod.testnet)**.

Optional (needs network egress, **no private key**):

```bash
npx tsx solver.ts --derive-only --mock --intent covenant-demo-1
```

---

## B. Live demo (once keys arrive)

### Prerequisites

- NEAR testnet account with test NEAR (deploy + bond + MPC gas)
- `NEAR_ACCOUNT_ID` / `NEAR_PRIVATE_KEY` in `solver/.env`
- Covenant contract deployed; `NEXT_PUBLIC_CONTRACT_ID` / `CONTRACT_ID` set
- Bitcoin testnet(4) recipient address you control
- BTC faucet funds on the **derived** Chain Signatures address

### Happy path — Do this / See that

**Do this:**
1. `npm run dev` in `frontend/` · connect NEAR testnet wallet.
2. Post intent: Bitcoin testnet + your recipient + small sats amount.
3. In another terminal:
   ```bash
   cd solver && npx tsx solver.ts --intent <intent_id> --quote-only
   ```
4. In UI: **Select winner**.
5. Fund the derived address printed by:
   ```bash
   npx tsx solver.ts --derive-only --intent <intent_id>
   ```
6. Settle:
   ```bash
   npx tsx solver.ts --intent <intent_id> --settle-only
   ```
7. Copy the Bitcoin tx hash from the UI / solver output.

**See that:**
- mempool.space/testnet shows BTC at the recipient.
- Bond Escrow shows bond **Released** (minus 1% fee to treasury).
- Recipient never interacted with NEAR.
- MPC sign against `v1.signer-prod.testnet` (load-bearing for the BTC tx).

### Slash path — Do this / See that

**Do this:**
1. Post a second intent; have solver quote + select winner (bond Locked).
2. Do **not** settle. Click **Simulate Failure** (creator/owner may slash early; anyone after deadline).

**See that:**
- Bond **Slashed** on NEAR explorer; treasury balance increases.
- Intent Failed or re-opened for next quote.
- No manual refund process.

### What judges should verify

- Chain Signature derivation path is intent-specific (`covenant-{id}`).
- BTC move uses MPC signing — not a NEAR transfer.
- Bond lock / release / slash are visible on-chain.
- Slash path requires no human dispute desk.

### Live transaction links (filled)

Contract: [`covenant-solver-mw2mng1b.testnet`](https://testnet.nearblocks.io/address/covenant-solver-mw2mng1b.testnet)

**Happy path — intent `covenant-1`**
- Deploy: https://testnet.nearblocks.io/txns/5g2zfuVLh4crak8vamGCjqXeJZL9NSAwRN38kDG6Zomw
- Init: https://testnet.nearblocks.io/txns/2VqS2GYe52SLFQNfv3thbab2ekPdCSCbsKZiYTALJboh
- Intent registration: https://testnet.nearblocks.io/txns/BSymLEZVhDs6YyC52NNukoqRyG6qmSEdTFpJrtJqXpp2
- Bond lock: https://testnet.nearblocks.io/txns/HAJwfDKKsDQhKkUKe5ZewxKCaz3kc6j1bhVcqmxVLzxT
- Select winner: https://testnet.nearblocks.io/txns/F42sDPwafLeHi6wkzAJSw6jL9DHynPCLRFGxWYcApofr
- Chain Signatures path: `covenant-covenant-1` → source `tb1qujayhkwa50v7l93g8ncgy2h9nsf4myfmqak7y3`
- MPC contract: `v1.signer-prod.testnet` (receipt `Fht1oJbX9j9XStqPXnGzxrxW7caj2VUx4XTo6QVS4Ukc`)
- Bitcoin testnet delivery (10 000 sats → `tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx`): https://mempool.space/testnet/tx/b206f1bd157d16f0d645cd381ed0f84aa9abaa984973495ef2f8c7b3721f73d0
- Bond release: https://testnet.nearblocks.io/txns/3EqqRpS3hEGvF1copeSg15vqnkkSG9jnisiSJHAqmTsA

**Slash path — intent `covenant-2`**
- Intent: https://testnet.nearblocks.io/txns/Hug6Ddu9A2vfCWBAeTxTTdWs9vzSv4rvvLQ6pnCp5RTe
- Bond lock: https://testnet.nearblocks.io/txns/CviDnqrt867X4a5KWKwRFNmNx5aNhJRZpy8kahxJ8uRf
- Select winner: https://testnet.nearblocks.io/txns/6H1s8piN4mD3t8UCovMK537WZUvKREaAtFeKux3pPAqf
- Bond slash: https://testnet.nearblocks.io/txns/5YknxXstSF3whRCCizzaMzVQRpCcCdVf6x3bcuPs76Fm

---

## One-Sentence Pitch for the Stage

“Covenant makes solver quotes enforceable: they lock a bond, Chain Signatures deliver real BTC to an address that never touches NEAR, and if they fail the bond slashes and the next solver finishes the job — no human in the middle.”
