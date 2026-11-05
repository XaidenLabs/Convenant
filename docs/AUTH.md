# Authentication model

Covenant does **not** use a traditional authenticated app (no email/password, OAuth, or user accounts).

## Who signs what

| Actor | Auth | Why |
|-------|------|-----|
| Intent creator | NEAR wallet connect | Must sign `post_intent` / `select_winner` / early slash on-chain |
| Solver | NEAR key in solver env | Signs `submit_quote`, MPC request, `submit_settlement_proof` |
| BTC recipient | **None** | Funds arrive at a Bitcoin address — no NEAR wallet, no Covenant login |
| Judges (offline) | Demo stub wallet | Local session only; mirrors bond states without keys |

## Product rule

If a screen can work without a NEAR signature, it stays public. Wallet connect appears only when an on-chain call is required.

## Do not build

- Email/password signup
- Session cookies for “logged-in users”
- KYC gates in the hackathon UI
- Gating the landing page or demo walkthrough behind auth
