# Covenant contract

Rust `near-sdk` bonded solver marketplace.

## Methods

| Method | Payable | Description |
|--------|---------|-------------|
| `new(treasury)` | init | Initialize with treasury account |
| `post_intent(...)` | | Create intent; returns `intent_id` |
| `submit_quote(...)` | yes (bond) | Lock NEAR bond + quote |
| `select_winner(intent_id)` | | Lock winner bond; refund others |
| `submit_settlement_proof(...)` | | Release bond (−1% fee) |
| `slash_and_handover(intent_id)` | | Slash after deadline / simulate failure |
| `get_intent` / `get_bond_state` / `get_quotes` | view | Read state |

## Build

```bash
# from contracts/
cargo test -p covenant --lib
cargo build -p covenant --target wasm32-unknown-unknown --release
# artifact: target/wasm32-unknown-unknown/release/covenant.wasm
# also copied to ../../res/covenant.wasm
```

## Deploy (NEAR testnet)

Requires `near` CLI + funded testnet account:

```bash
near deploy <account.testnet> ../../res/covenant.wasm \
  --initFunction new \
  --initArgs '{"treasury":"<treasury.testnet>"}' \
  --networkId testnet
```

Then set `NEXT_PUBLIC_CONTRACT_ID` / `CONTRACT_ID` to that account.
