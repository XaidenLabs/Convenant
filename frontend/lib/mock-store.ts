/**
 * In-memory Covenant contract stub for offline judge demos.
 * Mirrors on-chain bond state transitions without NEAR keys.
 */

import type {
  BondState,
  BondStateView,
  IntentStatus,
  IntentView,
  QuoteView,
} from "./contract";

export const DEMO_BOND = "100000000000000000000000"; // 0.1 NEAR
export const DEMO_SOLVER = "solver.demo.testnet";
export const DEMO_USER = "demo-user.testnet";

export type MockIntent = IntentView & {
  quotes: QuoteView[];
  bond: BondStateView;
  derivation_path: string;
};

const STORAGE_KEY = "covenant:mock:intent";
const HISTORY_KEY = "covenant:mock:history";
const ACTIVITY_KEY = "covenant:activity";

export function derivationPath(intentId: string): string {
  return `covenant-${intentId}`;
}

export function createMockIntent(opts: {
  recipient: string;
  amountMin: string;
  deadlineMinutes: number;
  creator?: string;
}): MockIntent {
  const id = `covenant-demo-${Date.now()}`;
  return {
    intent_id: id,
    creator: opts.creator || DEMO_USER,
    destination_chain: "bitcoin-testnet",
    recipient_address: opts.recipient,
    amount_min: opts.amountMin,
    deadline_ms: Date.now() + opts.deadlineMinutes * 60_000,
    status: "Open",
    created_at_ms: Date.now(),
    winner: null,
    btc_tx_hash: null,
    bond_state: "None",
    locked_bond: "0",
    quote_count: 0,
    quotes: [],
    bond: {
      state: "None",
      locked_amount: "0",
      solver: null,
      treasury_slashed: "0",
    },
    derivation_path: derivationPath(id),
  };
}

export function addQuote(intent: MockIntent, solver = DEMO_SOLVER): MockIntent {
  if (intent.status !== "Open" && intent.status !== "Quoted") {
    throw new Error(`Cannot quote in status ${intent.status}`);
  }
  const quote: QuoteView = {
    solver,
    quoted_amount: intent.amount_min,
    bond_amount: DEMO_BOND,
    submitted_at_ms: Date.now(),
    active: true,
  };
  return {
    ...intent,
    status: "Quoted",
    quote_count: intent.quote_count + 1,
    quotes: [...intent.quotes, quote],
  };
}

export function selectWinner(intent: MockIntent): MockIntent {
  // Match on-chain heuristic: highest quoted_amount, then highest bond.
  const active = intent.quotes.filter((q) => q.active);
  const winner = [...active].sort((a, b) => {
    try {
      const aq = BigInt(a.quoted_amount || "0");
      const bq = BigInt(b.quoted_amount || "0");
      if (bq !== aq) return bq > aq ? 1 : -1;
      const ab = BigInt(a.bond_amount || "0");
      const bb = BigInt(b.bond_amount || "0");
      if (bb !== ab) return bb > ab ? 1 : -1;
    } catch {
      /* fall through */
    }
    return b.submitted_at_ms - a.submitted_at_ms;
  })[0];
  if (!winner) throw new Error("No quotes to select");
  return {
    ...intent,
    status: "Selected",
    winner: winner.solver,
    bond_state: "Locked",
    locked_bond: winner.bond_amount,
    bond: {
      state: "Locked",
      locked_amount: winner.bond_amount,
      solver: winner.solver,
      treasury_slashed: intent.bond.treasury_slashed,
    },
  };
}

export function settleSuccess(intent: MockIntent, btcTxHash: string): MockIntent {
  if (intent.bond_state !== "Locked") {
    throw new Error("Bond not locked");
  }
  return {
    ...intent,
    status: "Completed",
    btc_tx_hash: btcTxHash,
    bond_state: "Released",
    locked_bond: "0",
    bond: {
      state: "Released",
      locked_amount: "0",
      solver: intent.winner,
      treasury_slashed: intent.bond.treasury_slashed,
    },
  };
}

export function slashAndHandover(intent: MockIntent): MockIntent {
  if (intent.bond_state !== "Locked") {
    throw new Error("No locked bond to slash");
  }
  const slashed = intent.locked_bond;
  const remaining = intent.quotes.filter(
    (q) => q.active && q.solver !== intent.winner
  );
  const inactiveQuotes = intent.quotes.map((q) =>
    q.solver === intent.winner ? { ...q, active: false } : q
  );

  if (remaining.length > 0) {
    return {
      ...intent,
      status: "Quoted",
      winner: null,
      btc_tx_hash: null,
      bond_state: "None",
      locked_bond: "0",
      quotes: inactiveQuotes,
      bond: {
        state: "None",
        locked_amount: "0",
        solver: null,
        treasury_slashed: (
          BigInt(intent.bond.treasury_slashed) + BigInt(slashed)
        ).toString(),
      },
    };
  }

  return {
    ...intent,
    status: "Failed",
    winner: null,
    btc_tx_hash: null,
    bond_state: "Slashed",
    locked_bond: "0",
    quotes: inactiveQuotes,
    bond: {
      state: "Slashed",
      locked_amount: "0",
      solver: null,
      treasury_slashed: (
        BigInt(intent.bond.treasury_slashed) + BigInt(slashed)
      ).toString(),
    },
  };
}

/** Demo BTC hash shaped like a real txid (64 hex). Offline only. */
export function demoBtcTxHash(intentId: string): string {
  const base = Array.from(intentId)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("")
    .padEnd(64, "ab")
    .slice(0, 64);
  return base;
}

export function persistMock(intent: MockIntent | null) {
  if (typeof sessionStorage === "undefined") return;
  if (!intent) {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
  upsertHistory(intent);
}

export function loadPersistedMock(): MockIntent | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MockIntent;
  } catch {
    return null;
  }
}

function upsertHistory(intent: MockIntent) {
  const history = loadIntentHistory().filter(
    (item) => item.intent_id !== intent.intent_id
  );
  history.unshift(intent);
  sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 12)));
}

export function loadIntentHistory(): MockIntent[] {
  if (typeof sessionStorage === "undefined") return [];
  const raw = sessionStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as MockIntent[];
  } catch {
    return [];
  }
}

export type ActivityItem = {
  id: string;
  at: number;
  message: string;
};

export function pushActivity(message: string): ActivityItem {
  const item: ActivityItem = {
    id: `act-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    at: Date.now(),
    message,
  };
  if (typeof sessionStorage === "undefined") return item;
  const prev = loadActivity();
  sessionStorage.setItem(
    ACTIVITY_KEY,
    JSON.stringify([item, ...prev].slice(0, 40))
  );
  return item;
}

export function loadActivity(): ActivityItem[] {
  if (typeof sessionStorage === "undefined") return [];
  const raw = sessionStorage.getItem(ACTIVITY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ActivityItem[];
  } catch {
    return [];
  }
}

export type DemoStep =
  | "post"
  | "quote"
  | "select"
  | "settle_or_slash"
  | "done";

export function currentStep(intent: MockIntent | null): DemoStep {
  if (!intent) return "post";
  if (intent.status === "Open") return "quote";
  if (intent.status === "Quoted") return "select";
  if (intent.status === "Selected" || intent.status === "Settling") {
    return "settle_or_slash";
  }
  return "done";
}

export function statusLabel(status: IntentStatus): string {
  return status;
}

export function bondLabel(state: BondState): string {
  return state;
}
