/**
 * Shared solver config.
 *
 * KEYS REQUIRED for live steps marked ★
 * Offline / dry-run works without NEAR_ACCOUNT_ID / NEAR_PRIVATE_KEY.
 */

export const NETWORK = process.env.NEAR_NETWORK || "testnet";
export const ACCOUNT_ID = process.env.NEAR_ACCOUNT_ID || "";
export const PRIVATE_KEY = process.env.NEAR_PRIVATE_KEY || "";
export const CONTRACT_ID =
  process.env.CONTRACT_ID || "covenant-solver-mw2mng1b.testnet";

/** Official NEAR testnet MPC for Chain Signatures. */
export const MPC_CONTRACT_ID =
  process.env.MPC_CONTRACT_ID || "v1.signer-prod.testnet";

/**
 * Bitcoin RPC used by chainsig.js Mempool adapter.
 * Official near-multichain examples use testnet4.
 * Override with MEMPOOL_API if your faucet/explorer differs.
 */
export const MEMPOOL_API =
  process.env.MEMPOOL_API || "https://mempool.space/testnet/api";

export const BTC_NETWORK =
  (process.env.BTC_NETWORK as "testnet" | "mainnet" | "regtest") || "testnet";

export const BOND_YOCTO =
  process.env.BOND_YOCTO || "100000000000000000000000"; // 0.1 NEAR

export const RPC =
  process.env.NEAR_RPC ||
  (NETWORK === "mainnet"
    ? "https://free.rpc.fastnear.com"
    : "https://test.rpc.fastnear.com");

export function hasNearKeys(): boolean {
  return Boolean(ACCOUNT_ID && PRIVATE_KEY);
}

/** Intent-specific Chain Signatures derivation path. */
export function derivationPathFor(intentId: string): string {
  return `covenant-${intentId}`;
}

export function mempoolTxUrl(txHash: string): string {
  // Prefer testnet4 explorer when using testnet4 API.
  if (MEMPOOL_API.includes("testnet4")) {
    return `https://mempool.space/testnet4/tx/${txHash}`;
  }
  return `https://mempool.space/testnet/tx/${txHash}`;
}
