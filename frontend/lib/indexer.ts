/**
 * Read path for scale: query the Covenant indexer.
 * Falls back gracefully when the indexer is offline — Protocol UI then
 * uses the shared live NEAR book for stats.
 */

export type IndexedIntent = {
  intent_id: string;
  creator: string;
  destination_chain: string;
  recipient_address: string;
  amount_min: string;
  deadline_ms: number;
  status: string;
  created_at_ms: number;
  winner: string | null;
  btc_tx_hash: string | null;
  bond_state: string;
  locked_bond: string;
  quote_count: number;
  treasury_slashed?: string;
  derivation_path?: string;
  updated_at_ms?: number;
  source?: string;
};

export type ProtocolStats = {
  network: string;
  contract_id: string;
  intent_count: number;
  open_count: number;
  completed_count: number;
  slashed_count: number;
  locked_bond_yocto: string;
  indexed_at_ms: number;
  syncing?: boolean;
  last_error?: string | null;
};

export type IndexerHealth = {
  ok: boolean;
  service: string;
  network: string;
  contract_id: string;
  poll_ms: number;
  syncing: boolean;
  last_sync_at_ms: number;
  last_sync_count: number;
  last_error: string | null;
  consecutive_errors: number;
  next_sync_at_ms: number;
  intent_count: number;
  source: "chain";
};

const BASE =
  process.env.NEXT_PUBLIC_INDEXER_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:8787";

async function getJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      cache: "no-store",
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchStats(): Promise<ProtocolStats | null> {
  return getJson<ProtocolStats>("/v1/stats");
}

export async function fetchHealth(): Promise<IndexerHealth | null> {
  return getJson<IndexerHealth>("/health");
}

export async function fetchIntents(params?: {
  status?: string;
  q?: string;
  limit?: number;
}): Promise<IndexedIntent[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.q) qs.set("q", params.q);
  if (params?.limit) qs.set("limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs}` : "";
  const data = await getJson<{ items: IndexedIntent[] }>(
    `/v1/intents${suffix}`
  );
  return data?.items || [];
}

export async function fetchIntent(id: string): Promise<{
  intent: IndexedIntent;
  quotes: {
    solver: string;
    quoted_amount: string;
    bond_amount: string;
    submitted_at_ms: number;
    active: boolean;
  }[];
} | null> {
  return getJson(`/v1/intents/${encodeURIComponent(id)}`);
}

export async function triggerIndexerSync(): Promise<{
  synced?: number;
  error?: string;
} | null> {
  try {
    const res = await fetch(`${BASE}/v1/sync`, {
      method: "POST",
      cache: "no-store",
    });
    const body = (await res.json()) as {
      synced?: number;
      error?: string;
    };
    if (!res.ok) return { error: body.error || `HTTP ${res.status}` };
    return body;
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function indexerHealthy(): Promise<boolean> {
  const health = await fetchHealth();
  return Boolean(health?.ok);
}

export function indexerBaseUrl() {
  return BASE;
}
