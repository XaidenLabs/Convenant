/**
 * Live Covenant order book — NEAR RPC only.
 * No seed rows, no session stubs, no mock intents.
 */

import {
  BondStateView,
  CONTRACT_ID,
  IntentView,
  NETWORK,
  QuoteView,
  getBondState,
  getIntent,
  getQuotes,
  listIntentIds,
} from "@/lib/contract";

export type LiveIntent = IntentView & {
  quotes: QuoteView[];
  bond: BondStateView;
  derivation_path: string;
};

export type LiveBookSnapshot = {
  contract_id: string;
  network: string;
  fetched_at_ms: number;
  intents: LiveIntent[];
  error?: string;
};

function derivationPath(intentId: string): string {
  return `covenant-${intentId}`;
}

function asAmount(value: unknown): string {
  if (value == null) return "0";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object" && value && "toString" in value) {
    return String((value as { toString(): string }).toString());
  }
  return "0";
}

function normalizeIntent(raw: IntentView): IntentView {
  return {
    ...raw,
    amount_min: asAmount(raw.amount_min),
    locked_bond: asAmount(raw.locked_bond),
  };
}

function normalizeQuotes(quotes: QuoteView[]): QuoteView[] {
  return quotes.map((q) => ({
    ...q,
    quoted_amount: asAmount(q.quoted_amount),
    bond_amount: asAmount(q.bond_amount),
  }));
}

function normalizeBond(bond: BondStateView): BondStateView {
  return {
    ...bond,
    locked_amount: asAmount(bond.locked_amount),
    treasury_slashed: asAmount(bond.treasury_slashed),
  };
}

function emptyBond(intent: IntentView): BondStateView {
  return {
    state: intent.bond_state,
    locked_amount: intent.locked_bond,
    solver: intent.winner,
    treasury_slashed: "0",
  };
}

type LoadResult =
  | { ok: true; intent: LiveIntent | null }
  | { ok: false; id: string; error: string };

async function loadOne(id: string): Promise<LoadResult> {
  try {
    const intent = await getIntent(id);
    if (!intent) {
      // Contract returned null — id is gone, not an RPC failure.
      return { ok: true, intent: null };
    }
    const [quotes, bond] = await Promise.all([
      getQuotes(id).catch(() => [] as QuoteView[]),
      getBondState(id),
    ]);
    const normalized = normalizeIntent(intent);
    // Prefer a successful bond view; never invent "None" over a known locked state.
    const bondNorm = bond ? normalizeBond(bond) : emptyBond(normalized);
    return {
      ok: true,
      intent: {
        ...normalized,
        quotes: normalizeQuotes(quotes),
        bond: bondNorm,
        bond_state: bond ? bondNorm.state : normalized.bond_state,
        locked_bond: bond
          ? bondNorm.locked_amount || normalized.locked_bond
          : normalized.locked_bond,
        derivation_path: derivationPath(normalized.intent_id),
      },
    };
  } catch (err) {
    return {
      ok: false,
      id,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Fetch intents with bounded concurrency to keep continuous polls snappy. */
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
  const runners = Array.from({ length: Math.min(limit, items.length) }, () =>
    run()
  );
  await Promise.all(runners);
  return out;
}

/** Fetch the full live book from the deployed Covenant contract. */
export async function fetchLiveBook(signal?: AbortSignal): Promise<LiveBookSnapshot> {
  const fetched_at_ms = Date.now();
  try {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const ids = await listIntentIds();
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const ordered = [...ids].reverse();
    const loaded = await mapPool(ordered, 4, async (id) => {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      return loadOne(id);
    });

    const intents: LiveIntent[] = [];
    const failures: string[] = [];
    for (const row of loaded) {
      if (!row.ok) {
        failures.push(`${row.id}: ${row.error}`);
        continue;
      }
      if (row.intent) intents.push(row.intent);
    }

    return {
      contract_id: CONTRACT_ID,
      network: NETWORK,
      fetched_at_ms: Date.now(),
      intents,
      error:
        failures.length > 0
          ? `Failed to load ${failures.length}/${ordered.length} intent(s): ${failures
              .slice(0, 3)
              .join("; ")}`
          : undefined,
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    return {
      contract_id: CONTRACT_ID,
      network: NETWORK,
      fetched_at_ms,
      intents: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
