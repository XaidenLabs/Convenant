/**
 * Covenant contract view + change helpers.
 *
 * Views: no keys (public RPC).
 * Changes (quote / proof): ★ NEAR keys required.
 */

import { BOND_YOCTO, CONTRACT_ID, RPC } from "./config.js";
import type { NearAccount } from "./near-account.js";

export type IntentView = {
  intent_id: string;
  recipient_address: string;
  amount_min: string;
  status: string;
  winner: string | null;
  deadline_ms: number;
  destination_chain: string;
  creator?: string;
  bond_state?: string;
  btc_tx_hash?: string | null;
};

export async function viewCall<T>(
  methodName: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "solver",
      method: "query",
      params: {
        request_type: "call_function",
        finality: "optimistic",
        account_id: CONTRACT_ID,
        method_name: methodName,
        args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
      },
    }),
  });
  const json = (await res.json()) as {
    error?: { message?: string };
    result?: { result?: number[]; error?: string };
  };
  if (json.error && !json.result) {
    throw new Error(json.error.message || "RPC error");
  }
  if (!json.result) throw new Error(json.error?.message || "Empty RPC result");
  if (json.result.error && !json.result.result) {
    throw new Error(json.result.error);
  }
  const text = Buffer.from(json.result.result || []).toString("utf8");
  return text ? (JSON.parse(text) as T) : (null as T);
}

export async function getIntent(intentId: string): Promise<IntentView | null> {
  return viewCall<IntentView | null>("get_intent", { intent_id: intentId });
}

export async function listIntentIds(): Promise<string[]> {
  return viewCall<string[]>("list_intent_ids");
}

export function mockIntent(intentId: string): IntentView {
  return {
    intent_id: intentId,
    recipient_address: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
    amount_min: "10000",
    status: "Selected",
    winner: "solver.covenant.testnet",
    deadline_ms: Date.now() + 30 * 60_000,
    destination_chain: "bitcoin-testnet",
    creator: "user.covenant.testnet",
    bond_state: "Locked",
    btc_tx_hash: null,
  };
}

/** ★ keys — attach NEAR bond and submit quote */
export async function submitQuote(
  account: NearAccount,
  intent: IntentView,
  dryRun: boolean
) {
  const args = {
    intent_id: intent.intent_id,
    quoted_amount: intent.amount_min,
    bond_amount: BOND_YOCTO,
  };
  console.log("→ submit_quote", args, `deposit=${BOND_YOCTO}`);
  if (dryRun || !account) {
    console.log("  (dry-run) skipped on-chain quote ★ needs NEAR keys + deposit");
    return;
  }
  await account.functionCall({
    contractId: CONTRACT_ID,
    methodName: "submit_quote",
    args,
    gas: BigInt("30000000000000"),
    attachedDeposit: BigInt(BOND_YOCTO),
  });
  console.log("✓ quote + bond locked");
}

/** ★ keys — winning solver submits BTC tx hash */
export async function submitSettlementProof(
  account: NearAccount,
  intentId: string,
  btcTxHash: string,
  dryRun: boolean
) {
  console.log("→ submit_settlement_proof", { intentId, btcTxHash });
  if (dryRun || !account) {
    console.log("  (dry-run) skipped proof ★ needs NEAR keys as winning solver");
    return;
  }
  await account.functionCall({
    contractId: CONTRACT_ID,
    methodName: "submit_settlement_proof",
    args: { intent_id: intentId, btc_tx_hash: btcTxHash },
    gas: BigInt("30000000000000"),
    attachedDeposit: BigInt(0),
  });
  console.log("✓ proof submitted — bond should release");
}
