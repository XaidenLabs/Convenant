import type { LiveIntent } from "@/lib/live-book";
import { laneFor } from "@/lib/solver-ops";

export type ExploreLane =
  | "all"
  | "open"
  | "settling"
  | "settled"
  | "slashed";

export function exploreLaneFor(intent: LiveIntent): ExploreLane {
  if (intent.bond_state === "Slashed" || intent.status === "Failed") {
    return "slashed";
  }
  if (intent.status === "Completed" || intent.bond_state === "Released") {
    return "settled";
  }
  const lane = laneFor(intent);
  if (lane === "open") return "open";
  if (lane === "settling") return "settling";
  return "settled";
}

export function deadlineNeedsUrgency(intent: LiveIntent): boolean {
  return (
    exploreLaneFor(intent) === "open" || exploreLaneFor(intent) === "settling"
  );
}

/** One-line public story for the selected settlement. */
export function settlementStory(intent: LiveIntent): string {
  const lane = exploreLaneFor(intent);
  if (lane === "slashed") {
    return "Settlement failed or timed out — the locked bond was slashed on NEAR.";
  }
  if (lane === "settled") {
    return intent.btc_tx_hash
      ? "BTC proof submitted — bond released to the winning solver."
      : "Marked completed on-chain — bond released.";
  }
  if (lane === "settling") {
    return "Winner selected and bond locked — solver must deliver BTC before the deadline.";
  }
  if (intent.quote_count > 0) {
    return "Open for bonded quotes — creators can select a winner when ready.";
  }
  return "Intent posted — waiting for solvers to lock a bond and quote.";
}

export function nearAccountUrl(accountId: string): string {
  return `https://testnet.nearblocks.io/address/${accountId}`;
}

export function exploreSharePath(intentId: string | null): string {
  if (!intentId) return "/explore";
  return `/explore?id=${encodeURIComponent(intentId)}`;
}
