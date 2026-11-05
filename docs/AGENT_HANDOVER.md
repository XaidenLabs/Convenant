# Covenant — Agent Handover Document

**Hand this entire file to your coding agent (Claude Code, Codex, Cursor, etc.).**

You are building **Covenant**, a bonded solver marketplace on NEAR for the Real-World Money track of the NEAR Hackathon.

## One-sentence goal

Build a working prototype where solvers lock a bond when quoting an intent, settle real BTC (Bitcoin testnet) via NEAR Chain Signatures to a recipient address that never touches NEAR, and the bond is automatically slashed if settlement fails.

## What success looks like

1. User posts an intent from a NEAR testnet account.
2. A solver (or simulated solver) locks a bond and quotes a rate.
3. Winning solver uses Chain Signatures to send BTC on Bitcoin testnet to a recipient address.
4. On success, bond is released.
5. On failure (timeout or deliberate simulation), bond is slashed on-chain and the system can hand over to another solver.
6. Frontend shows bond state, quotes, and the final Bitcoin tx hash.
7. README contains clear “do this, see that” steps for judges.

## Tech stack (use these)

- **Smart contracts**: Rust + `near-sdk` (latest)
- **Frontend**: Next.js (App Router) + TypeScript + Tailwind
- **Chain Signatures**: `chainsig.js` (or equivalent) + NEAR testnet MPC contract `v1.signer-prod.testnet`
- **Bitcoin**: Bitcoin testnet (mempool.space/testnet or testnet4)
- **Wallet**: `@hot-labs/near-connect` or standard NEAR wallet selector
- **Testing**: NEAR testnet + Bitcoin testnet

## Repository structure (create this)

```
covenant/
├── contracts/
│   └── covenant/
│       ├── src/
│       │   └── lib.rs
│       └── Cargo.toml
├── frontend/
│   ├── app/
│   ├── components/
│   └── package.json
├── solver/
│   └── solver.ts          # simple Node script that quotes + settles
├── docs/
│   ├── ARCHITECTURE.md
│   └── DEMO.md
└── README.md
```

## Contract interfaces (implement these)

### Intent Registry + Bond Escrow (can be one contract for the prototype)

```rust
// High-level methods the agent should implement

pub fn post_intent(
    &mut self,
    destination_chain: String,      // "bitcoin-testnet"
    recipient_address: String,
    amount_min: U128,               // minimum acceptable output
    deadline_ms: u64,
) -> String;                        // returns intent_id

pub fn submit_quote(
    &mut self,
    intent_id: String,
    quoted_amount: U128,
    bond_amount: U128,
);

pub fn select_winner(&mut self, intent_id: String);

pub fn submit_settlement_proof(
    &mut self,
    intent_id: String,
    btc_tx_hash: String,
    // optional: additional proof fields
);

pub fn slash_and_handover(&mut self, intent_id: String);  // callable by anyone after deadline

pub fn get_intent(&self, intent_id: String) -> Option<Intent>;
pub fn get_bond_state(&self, intent_id: String) -> BondState;
```

### Bond logic (must be real, not simulated)

- Solver attaches NEAR (or a mock FT) as bond when calling `submit_quote`.
- On successful `submit_settlement_proof` (basic validation for hackathon), return bond + fee.
- On `slash_and_handover` (after deadline or failed proof), slash bond and mark next solver (or re-open).

## Chain Signatures flow the solver must implement

1. Derive a Bitcoin address controlled by the NEAR account / contract using a unique path (e.g. `covenant-{intent_id}`).
2. Build a Bitcoin testnet transaction that sends to the recipient.
3. Call the MPC contract (`v1.signer-prod.testnet`) `sign` method with the payload and path.
4. Broadcast the signed transaction to Bitcoin testnet.
5. Submit the tx hash back to the Covenant contract as proof.

Useful libraries:
- Frontend / solver JS: `chainsig.js`
- Rust side (if building tx inside contract): `omni-transaction-rs` (optional for prototype)

Testnet MPC contract: `v1.signer-prod.testnet`

## Frontend requirements

- Form to post intent (recipient Bitcoin address + amount).
- Live list of quotes and bond amounts.
- Button to trigger settlement (or auto via solver).
- Display of Bitcoin tx hash + link to mempool.space/testnet.
- Display of bond state (locked / released / slashed).
- Simple “Simulate Failure” button that calls `slash_and_handover`.

## Solver script

A Node.js script (`solver/solver.ts`) that:
- Listens for open intents (or is manually triggered).
- Submits a quote + bond.
- On win, performs the Chain Signatures Bitcoin transfer.
- Submits the proof.

## Demo requirements (must work)

- Happy path: intent → quote → bond → BTC arrives on testnet → bond released.
- Failure path: intent → quote → bond → simulate failure → bond slashed.

## README requirements

The README must contain:
- Clear problem / solution
- Architecture summary
- Exact demo steps (“Do this / See that”)
- Links to NEAR explorer and Bitcoin explorer transactions once live
- Note that this is for the Real-World Money track

## Build order (follow this)

1. Scaffold the Next.js frontend and Rust contract.
2. Implement basic `post_intent` + `submit_quote` + bond storage.
3. Implement Chain Signatures Bitcoin testnet transfer in the solver script.
4. Wire settlement proof + bond release.
5. Implement slash path.
6. Polish frontend so judges can click through both paths.
7. Write the final README with real transaction links from your demo runs.

## Acceptance criteria

- [ ] Contract deployed on NEAR testnet
- [ ] Frontend connected and functional
- [ ] At least one real Bitcoin testnet transaction completed via Chain Signatures
- [ ] Bond slash demonstrated on-chain
- [ ] README has copy-paste demo steps
- [ ] Repository is public

## Official docs to reference

- Chain Signatures: https://docs.near.org/chain-abstraction/chain-signatures
- Implementation guide: https://docs.near.org/chain-abstraction/chain-signatures/implementation
- near-sdk: https://docs.near.org/tools/sdk
- chainsig.js: https://github.com/NearDeFi/chainsig.js
- near-multichain examples: https://github.com/near-examples/near-multichain

Start building. Prioritize a working end-to-end demo over perfect code.
