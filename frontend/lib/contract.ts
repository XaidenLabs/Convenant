/** Covenant contract helpers — view + change method wrappers. */

export const NETWORK = process.env.NEXT_PUBLIC_NETWORK || "testnet";
export const CONTRACT_ID =
  process.env.NEXT_PUBLIC_CONTRACT_ID || "covenant-solver-mw2mng1b.testnet";

export type IntentStatus =
  | "Open"
  | "Quoted"
  | "Selected"
  | "Settling"
  | "Completed"
  | "Failed"
  | "Expired";

export type BondState = "None" | "Locked" | "Released" | "Slashed";

export interface IntentView {
  intent_id: string;
  creator: string;
  destination_chain: string;
  recipient_address: string;
  amount_min: string;
  deadline_ms: number;
  status: IntentStatus;
  created_at_ms: number;
  winner: string | null;
  btc_tx_hash: string | null;
  bond_state: BondState;
  locked_bond: string;
  quote_count: number;
}

export interface QuoteView {
  solver: string;
  quoted_amount: string;
  bond_amount: string;
  submitted_at_ms: number;
  active: boolean;
}

export interface BondStateView {
  state: BondState;
  locked_amount: string;
  solver: string | null;
  treasury_slashed: string;
}

const RPC =
  process.env.NEXT_PUBLIC_NEAR_RPC ||
  (NETWORK === "mainnet"
    ? "https://free.rpc.fastnear.com"
    : "https://test.rpc.fastnear.com");

async function viewFunction<T>(
  methodName: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "covenant",
      method: "query",
      params: {
        request_type: "call_function",
        finality: "optimistic",
        account_id: CONTRACT_ID,
        method_name: methodName,
        args_base64:
          typeof btoa !== "undefined"
            ? btoa(JSON.stringify(args))
            : Buffer.from(JSON.stringify(args)).toString("base64"),
      },
    }),
  });
  const json = await res.json();
  // Some providers return deprecation text in `error` even when `result` is usable.
  if (json.error && !json.result) {
    throw new Error(json.error.message || JSON.stringify(json.error));
  }
  const result = json.result;
  if (!result) {
    throw new Error(json.error?.message || "Empty RPC result");
  }
  if (result.error && !result.result) {
    throw new Error(result.error);
  }
  const bytes = new Uint8Array(result.result || []);
  const text = new TextDecoder().decode(bytes);
  return text ? (JSON.parse(text) as T) : (null as T);
}

export async function listIntentIds(): Promise<string[]> {
  try {
    const ids = await viewFunction<string[]>("list_intent_ids");
    return Array.isArray(ids) ? ids : [];
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err));
  }
}

/** Soft list — empty on failure (create console boot). */
export async function listIntentIdsSoft(): Promise<string[]> {
  try {
    return await listIntentIds();
  } catch {
    return [];
  }
}

/** Throws on RPC failure; returns null when the intent truly does not exist. */
export async function getIntent(
  intentId: string
): Promise<IntentView | null> {
  return viewFunction<IntentView | null>("get_intent", {
    intent_id: intentId,
  });
}

/** Soft get — null on missing intent or RPC failure. */
export async function getIntentSoft(
  intentId: string
): Promise<IntentView | null> {
  try {
    return await getIntent(intentId);
  } catch {
    return null;
  }
}

export async function getQuotes(intentId: string): Promise<QuoteView[]> {
  return viewFunction<QuoteView[]>("get_quotes", {
    intent_id: intentId,
  });
}

export async function getQuotesSoft(intentId: string): Promise<QuoteView[]> {
  try {
    return await getQuotes(intentId);
  } catch {
    return [];
  }
}

/**
 * Bond view — returns null on RPC failure so callers keep intent.bond_state
 * instead of inventing "None".
 */
export async function getBondState(
  intentId: string
): Promise<BondStateView | null> {
  try {
    return await viewFunction<BondStateView>("get_bond_state", {
      intent_id: intentId,
    });
  } catch {
    return null;
  }
}

export function mempoolUrl(txHash: string): string {
  // Prefer testnet4 to match chainsig.js / near-multichain defaults.
  const base =
    process.env.NEXT_PUBLIC_MEMPOOL_EXPLORER ||
    "https://mempool.space/testnet4/tx";
  return `${base}/${txHash}`;
}

export function nearExplorerTx(txHash: string): string {
  return `https://testnet.nearblocks.io/txns/${txHash}`;
}

export function yoctoToNear(yocto: string | number): string {
  const n = BigInt(yocto.toString());
  const whole = n / 10n ** 24n;
  const frac = n % 10n ** 24n;
  const fracStr = frac.toString().padStart(24, "0").slice(0, 4);
  return `${whole}.${fracStr}`;
}
