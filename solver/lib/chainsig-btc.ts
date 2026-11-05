/**
 * Chain Signatures Bitcoin testnet settlement via chainsig.js.
 *
 * BTC signing support status (verified against chainsig.js 1.1.x docs +
 * near-multichain Bitcoin.jsx + NEAR Chain Signatures implementation guide):
 * - **Supported**: Bitcoin mainnet + testnet P2WPKH via `chainAdapters.btc.Bitcoin`
 * - MPC contract (testnet): `v1.signer-prod.testnet`
 * - Derivation path: intent-specific `covenant-{intent_id}`
 * - Local pubkey derivation works client-side for the known MPC deployment
 *   (no NEAR key needed for *address derivation alone* when RPC is reachable)
 *
 * What needs keys / funds:
 * | Step                         | Keys / funds                          |
 * |------------------------------|---------------------------------------|
 * | Create adapters              | none                                  |
 * | Derive BTC address           | none★ (public RPC + known MPC root)   |
 * | Check balance / UTXOs        | none (mempool API)                    |
 * | MPC `sign`                   | ★ NEAR account + key + NEAR for gas   |
 * | Broadcast signed BTC tx      | ★ funded derived address (BTC faucet) |
 * | submit_settlement_proof      | ★ NEAR key (winning solver)           |
 *
 * ★ Derive may still need network egress to mempool / NEAR RPC. Use --dry-run
 *   to skip all network-dependent settlement and print the planned flow.
 */

import { chainAdapters, contracts } from "chainsig.js";
import {
  ACCOUNT_ID,
  BTC_NETWORK,
  MEMPOOL_API,
  MPC_CONTRACT_ID,
  NETWORK,
  derivationPathFor,
  hasNearKeys,
  mempoolTxUrl,
} from "./config.js";
import { NearAccount, toSignerAccount } from "./near-account.js";

export type SettlementIntent = {
  intent_id: string;
  recipient_address: string;
  amount_min: string; // sats as decimal string
};

export type DerivedBtcAddress = {
  path: string;
  address: string;
  publicKey: string;
  mpcContract: string;
};

export type SettlementResult = {
  txHash: string;
  explorerUrl: string;
  derived: DerivedBtcAddress;
  dryRun: boolean;
};

function createMpcContract() {
  return new contracts.ChainSignatureContract({
    networkId: NETWORK === "mainnet" ? "mainnet" : "testnet",
    contractId: MPC_CONTRACT_ID,
  });
}

function createBitcoin(mpc: InstanceType<typeof contracts.ChainSignatureContract>) {
  const btcRpcAdapter = new chainAdapters.btc.BTCRpcAdapters.Mempool(MEMPOOL_API);
  return new chainAdapters.btc.Bitcoin({
    network: BTC_NETWORK,
    contract: mpc,
    btcRpcAdapter,
  });
}

/** Build MPC + BTC adapters (no keys required). */
export function createChainSigStack() {
  const mpc = createMpcContract();
  const btc = createBitcoin(mpc);
  return { mpc, btc };
}

/**
 * Derive the intent-specific Bitcoin testnet address controlled via Chain Signatures.
 * Does not require NEAR private key when using v1.signer-prod.testnet (local KDF).
 * Still needs network for contract fallback on custom MPC deployments.
 */
export async function deriveIntentBtcAddress(
  intentId: string,
  predecessor = ACCOUNT_ID || "solver.covenant.testnet"
): Promise<DerivedBtcAddress> {
  const path = derivationPathFor(intentId);
  const { btc } = createChainSigStack();
  const { address, publicKey } = await btc.deriveAddressAndPublicKey(
    predecessor,
    path
  );
  return {
    path,
    address,
    publicKey,
    mpcContract: MPC_CONTRACT_ID,
  };
}

export async function getBtcBalanceSats(address: string): Promise<number> {
  const { btc } = createChainSigStack();
  const { balance } = await btc.getBalance(address);
  return Number(balance);
}

/**
 * Full settlement: derive → fund check → prepare → MPC sign → finalize → broadcast.
 * Returns a dry-run placeholder hash when keys are missing or dryRun=true.
 */
export async function settleBtcWithChainSignatures(opts: {
  intent: SettlementIntent;
  account: NearAccount;
  dryRun: boolean;
  feeBufferSats?: number;
}): Promise<SettlementResult> {
  const { intent, account, dryRun } = opts;
  const feeBuffer = opts.feeBufferSats ?? 500;
  const path = derivationPathFor(intent.intent_id);
  const predecessor = ACCOUNT_ID || "solver.covenant.testnet";

  console.log("→ Chain Signatures BTC settlement");
  console.log(`  MPC: ${MPC_CONTRACT_ID}`);
  console.log(`  path: ${path}`);
  console.log(`  recipient: ${intent.recipient_address}`);
  console.log(`  amount (sats): ${intent.amount_min}`);
  console.log(`  mempool API: ${MEMPOOL_API}`);
  console.log(
    "  BTC signing: supported (P2WPKH) via chainsig.js chainAdapters.btc.Bitcoin"
  );

  if (dryRun || !hasNearKeys() || !account) {
    console.log("  mode: DRY-RUN (no NEAR keys / --dry-run)");
    console.log("  planned steps:");
    console.log("    1. deriveAddressAndPublicKey(predecessor, path)");
    console.log("    2. fund derived address from BTC testnet faucet");
    console.log("    3. prepareTransactionForSigning({ from, to, value, publicKey })");
    console.log("    4. mpc.sign({ payloads, path, keyType: 'Ecdsa', signerAccount }) ★ keys");
    console.log("    5. finalizeTransactionSigning + broadcastTx ★ funded UTXO");
    console.log("    6. submit_settlement_proof(btc_tx_hash) ★ keys");
    const fake = `dry-run-btc-${intent.intent_id}-${Date.now().toString(16)}`;
    return {
      txHash: fake,
      explorerUrl: mempoolTxUrl(fake),
      derived: {
        path,
        address: `(derive with: npx tsx solver.ts --derive-only --intent ${intent.intent_id})`,
        publicKey: "(pending)",
        mpcContract: MPC_CONTRACT_ID,
      },
      dryRun: true,
    };
  }

  const { mpc, btc } = createChainSigStack();
  const derived = await btc.deriveAddressAndPublicKey(predecessor, path);
  console.log(`  derived address: ${derived.address}`);
  console.log(`  public key: ${derived.publicKey.slice(0, 18)}…`);

  const { balance } = await btc.getBalance(derived.address);
  const balanceSats = Number(balance);
  console.log(`  balance: ${balanceSats} sats`);

  const amount = Number(intent.amount_min);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Invalid amount_min: ${intent.amount_min}`);
  }
  if (balanceSats < amount + feeBuffer) {
    throw new Error(
      `Insufficient BTC on ${derived.address}: have ${balanceSats}, need ~${
        amount + feeBuffer
      } sats. Fund via a Bitcoin testnet faucet, then re-run --settle-only.`
    );
  }

  const { transaction, hashesToSign } = await btc.prepareTransactionForSigning({
    publicKey: derived.publicKey,
    from: derived.address,
    to: intent.recipient_address,
    value: String(amount),
  });

  console.log(`  hashes to sign: ${hashesToSign.length}`);
  const signerAccount = toSignerAccount(account);
  const rsvSignatures = await mpc.sign({
    payloads: hashesToSign,
    path,
    keyType: "Ecdsa",
    signerAccount,
  });

  const signedTx = btc.finalizeTransactionSigning({
    transaction,
    rsvSignatures,
  });

  const { hash } = await btc.broadcastTx(signedTx);
  console.log(`✓ broadcast: ${hash}`);
  console.log(`  explorer: ${mempoolTxUrl(hash)}`);

  return {
    txHash: hash,
    explorerUrl: mempoolTxUrl(hash),
    derived: {
      path,
      address: derived.address,
      publicKey: derived.publicKey,
      mpcContract: MPC_CONTRACT_ID,
    },
    dryRun: false,
  };
}
