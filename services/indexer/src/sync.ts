import { CONTRACT_ID, NETWORK, viewFunction } from "./near.js";
import type { IntentStore } from "./store.js";
import type {
  BondState,
  IndexedIntent,
  IndexedQuote,
  IntentStatus,
} from "./types.js";

type ChainIntent = {
  intent_id: string;
  creator: string;
  destination_chain: string;
  recipient_address: string;
  amount_min: string | { toString(): string };
  deadline_ms: number;
  status: IntentStatus;
  created_at_ms: number;
  winner: string | null;
  btc_tx_hash: string | null;
  bond_state: BondState;
  locked_bond: string | { toString(): string };
  quote_count: number;
};

type ChainQuote = {
  solver: string;
  quoted_amount: string | { toString(): string };
  bond_amount: string | { toString(): string };
  submitted_at_ms: number;
  active: boolean;
};

function asString(v: string | { toString(): string } | null | undefined) {
  if (v == null) return "0";
  return typeof v === "string" ? v : v.toString();
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      out[index] = await worker(items[index]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length || 1) }, () => run())
  );
  return out;
}

async function loadOne(
  id: string
): Promise<{ intent: IndexedIntent; quotes: IndexedQuote[] } | null> {
  const intent = await viewFunction<ChainIntent | null>("get_intent", {
    intent_id: id,
  });
  if (!intent) return null;

  const [quotesRaw, bond] = await Promise.all([
    viewFunction<ChainQuote[]>("get_quotes", { intent_id: id }),
    viewFunction<{
      state: BondState;
      locked_amount: string | { toString(): string };
      treasury_slashed: string | { toString(): string };
    }>("get_bond_state", { intent_id: id }),
  ]);

  const record: IndexedIntent = {
    intent_id: intent.intent_id,
    creator: intent.creator,
    destination_chain: intent.destination_chain,
    recipient_address: intent.recipient_address,
    amount_min: asString(intent.amount_min),
    deadline_ms: intent.deadline_ms,
    status: intent.status,
    created_at_ms: intent.created_at_ms,
    winner: intent.winner,
    btc_tx_hash: intent.btc_tx_hash,
    bond_state: bond?.state || intent.bond_state,
    locked_bond: asString(bond?.locked_amount ?? intent.locked_bond),
    quote_count: intent.quote_count,
    treasury_slashed: asString(bond?.treasury_slashed),
    derivation_path: `covenant-${intent.intent_id}`,
    updated_at_ms: Date.now(),
    source: "chain",
  };

  const quotes: IndexedQuote[] = (quotesRaw || []).map((q) => ({
    intent_id: id,
    solver: q.solver,
    quoted_amount: asString(q.quoted_amount),
    bond_amount: asString(q.bond_amount),
    submitted_at_ms: q.submitted_at_ms,
    active: q.active,
  }));

  return { intent: record, quotes };
}

/** Sync all intents from the live Covenant contract into the store. */
export async function syncFromChain(store: IntentStore): Promise<number> {
  const ids = await viewFunction<string[]>("list_intent_ids");
  const ordered = [...(ids || [])].reverse();
  const loaded = await mapPool(ordered, 4, (id) => loadOne(id));

  let synced = 0;
  for (const row of loaded) {
    if (!row) continue;
    store.upsertIntent(row.intent);
    store.setQuotes(row.intent.intent_id, row.quotes);
    synced += 1;
  }

  store.persist();
  console.log(
    `[indexer] synced ${synced} intents from ${CONTRACT_ID} (${NETWORK})`
  );
  return synced;
}
