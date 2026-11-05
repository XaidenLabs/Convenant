import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import type { IndexedIntent, IndexedQuote, StoreSnapshot } from "./types.js";

/**
 * File-backed intent store.
 * Swap this module for Postgres later — API surface stays the same.
 */
export class IntentStore {
  private intents = new Map<string, IndexedIntent>();
  private quotes = new Map<string, IndexedQuote[]>();
  private syncedAt = 0;

  constructor(private readonly path: string) {
    this.load();
  }

  private load() {
    if (!existsSync(this.path)) return;
    try {
      const raw = JSON.parse(readFileSync(this.path, "utf8")) as StoreSnapshot;
      for (const intent of raw.intents || []) {
        this.intents.set(intent.intent_id, intent);
      }
      const byIntent = new Map<string, IndexedQuote[]>();
      for (const quote of raw.quotes || []) {
        const list = byIntent.get(quote.intent_id) || [];
        list.push(quote);
        byIntent.set(quote.intent_id, list);
      }
      this.quotes = byIntent;
      this.syncedAt = raw.synced_at_ms || 0;
    } catch {
      // corrupt file — start empty
    }
  }

  persist() {
    mkdirSync(dirname(this.path), { recursive: true });
    const snapshot: StoreSnapshot = {
      intents: [...this.intents.values()].sort(
        (a, b) => b.created_at_ms - a.created_at_ms
      ),
      quotes: [...this.quotes.entries()].flatMap(([intent_id, list]) =>
        list.map((q) => ({ ...q, intent_id }))
      ),
      synced_at_ms: this.syncedAt || Date.now(),
    };
    writeFileSync(this.path, JSON.stringify(snapshot, null, 2));
  }

  upsertIntent(intent: IndexedIntent) {
    this.intents.set(intent.intent_id, intent);
    this.syncedAt = Date.now();
  }

  setQuotes(intentId: string, quotes: IndexedQuote[]) {
    this.quotes.set(intentId, quotes);
    this.syncedAt = Date.now();
  }

  getIntent(id: string) {
    return this.intents.get(id) || null;
  }

  listIntents(filter?: {
    status?: string;
    q?: string;
    limit?: number;
  }): IndexedIntent[] {
    let rows = [...this.intents.values()].sort(
      (a, b) => b.created_at_ms - a.created_at_ms
    );
    if (filter?.status) {
      rows = rows.filter((r) => r.status === filter.status);
    }
    if (filter?.q) {
      const q = filter.q.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.intent_id.toLowerCase().includes(q) ||
          r.recipient_address.toLowerCase().includes(q) ||
          (r.winner || "").toLowerCase().includes(q)
      );
    }
    return rows.slice(0, filter?.limit ?? 50);
  }

  getQuotes(intentId: string) {
    return this.quotes.get(intentId) || [];
  }

  stats(network: string, contractId: string) {
    const intents = [...this.intents.values()];
    const locked = intents
      .filter((i) => i.bond_state === "Locked")
      .reduce((acc, i) => acc + BigInt(i.locked_bond || "0"), 0n);
    return {
      network,
      contract_id: contractId,
      intent_count: intents.length,
      open_count: intents.filter((i) => i.status === "Open" || i.status === "Quoted")
        .length,
      completed_count: intents.filter((i) => i.status === "Completed").length,
      slashed_count: intents.filter(
        (i) => i.bond_state === "Slashed" || i.status === "Failed"
      ).length,
      locked_bond_yocto: locked.toString(),
      indexed_at_ms: this.syncedAt || Date.now(),
    };
  }
}
