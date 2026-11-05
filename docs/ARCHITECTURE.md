# Covenant Architecture

## Goal

Enforce solver quotes on NEAR Intents so that real-world money delivery (remittances, payroll, merchant payments) does not depend on trust or human arbitration.

## System Components

### 1. Intent Registry (NEAR Contract)
- Accepts signed intents from users.
- Stores: source asset, destination asset/chain, amount, recipient address, deadline, minimum acceptable rate.
- Tracks state: open → quoted → selected → settling → completed / failed.

### 2. Bond Escrow (NEAR Contract)
- Solvers deposit a bond (NEAR or stablecoin) when submitting a quote.
- Bond amount can be fixed or proportional to the quoted value.
- On success: bond returned + fee from the spread or protocol.
- On failure (timeout, under-delivery, or verification fail): bond slashed to the protocol treasury or the next solver / user compensation pool.
- Supports ordered handover: next highest bidder is automatically activated.

### 3. Settlement Verifier (NEAR Contract)
- Receives proof that the Chain Signature transaction was broadcast and confirmed on the destination chain.
- Verifies:
  - Destination address matches the intent.
  - Amount is ≥ quoted amount (within slippage tolerance).
  - Timestamp is within the deadline.
- Can use light client style proofs or trusted relay + on-chain check of the signature and destination (for hackathon scope, a practical verification path is acceptable as long as the slash condition is clear).

### 4. Solver Client
- Listens for open intents.
- Calculates rate, decides bond size, submits quote + bond.
- On win: constructs the destination-chain transaction, requests Chain Signature from the NEAR MPC via the signing contract, broadcasts it, and submits proof back to the Verifier.
- Can be run as a simple script or as an agent.

### 5. Frontend
- User creates an intent (or uses a pre-filled remittance form).
- Shows live bond state, competing quotes, and settlement progress.
- Displays the final destination transaction hash so judges can verify on a Bitcoin testnet explorer.

## Chain Signatures Integration

- Derivation path is unique per intent (e.g. `covenant-intent-{id}`).
- The Covenant contract (or a controlled account) calls the Chain Signatures contract (`v1.signer` or testnet equivalent) to sign the Bitcoin transaction.
- The resulting signature is used to broadcast a native Bitcoin transaction to the recipient address.
- No wrapped token, no bridge contract on Bitcoin.

## Failure & Slash Flow

1. Winning solver is given a deadline.
2. If no valid proof is submitted by the deadline, or the proof fails verification, the contract marks the solver as failed.
3. Bond is slashed.
4. The next solver in the ordered list is notified (or the system re-opens the intent with the remaining bond value as additional incentive).
5. Process repeats until success or the intent expires.

## Security Considerations (Hackathon Scope)

- Bonds must be large enough that rational solvers prefer to complete rather than lose the bond.
- Rate limiting and minimum bond sizes prevent spam.
- Chain Signature derivation paths are intent-specific to avoid key reuse issues.
- For production: light client verification of destination-chain finality. For the hackathon, a clear, auditable verification path + visible slash is the priority.

## Data Flow Diagram (Text)

```
User → Intent Registry (post intent)
Solvers → Bond Escrow (quote + lock)
Bond Escrow → Intent Registry (select winner)
Winning Solver → Chain Signatures MPC (request sign)
MPC → Solver (signature)
Solver → Bitcoin network (broadcast tx)
Solver → Settlement Verifier (submit proof)
Settlement Verifier → Bond Escrow (success or slash)
```

This architecture keeps the enforcement entirely on NEAR while the actual value moves on the destination chain via Chain Signatures.
