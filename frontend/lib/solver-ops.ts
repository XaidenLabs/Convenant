import type { LiveIntent } from "@/lib/live-book";

export type SolverLane = "open" | "settling" | "terminal";

export function laneFor(intent: Pick<LiveIntent, "status">): SolverLane {
  if (intent.status === "Open" || intent.status === "Quoted") return "open";
  if (intent.status === "Selected" || intent.status === "Settling") {
    return "settling";
  }
  return "terminal";
}

export function derivationPathFor(
  intent: Pick<LiveIntent, "intent_id" | "derivation_path">
): string {
  return intent.derivation_path || `covenant-${intent.intent_id}`;
}

export function quoteCommand(intentId: string): string {
  return `cd solver && npx tsx solver.ts --intent ${intentId} --quote-only`;
}

export function deriveCommand(intentId: string): string {
  return `cd solver && npx tsx solver.ts --derive-only --intent ${intentId}`;
}

export function settleCommand(intentId: string): string {
  return `cd solver && npx tsx solver.ts --intent ${intentId} --settle-only`;
}

export function watchCommand(autoQuote = false): string {
  return autoQuote
    ? `cd solver && npm run watch -- --auto-quote --interval 15`
    : `cd solver && npm run watch`;
}

export function dryRunCommand(): string {
  return `cd solver && npm run dry`;
}

/** Settlement checklist driven by live bond/status. */
export function settlementSteps(intent: LiveIntent): {
  id: string;
  label: string;
  done: boolean;
  active: boolean;
}[] {
  const locked =
    intent.bond_state === "Locked" ||
    intent.status === "Selected" ||
    intent.status === "Settling";
  const completed =
    intent.status === "Completed" || intent.bond_state === "Released";
  const failed =
    intent.status === "Failed" || intent.bond_state === "Slashed";

  if (failed) {
    return [
      { id: "quoted", label: "Quote + bond", done: true, active: false },
      { id: "selected", label: "Winner selected", done: true, active: false },
      { id: "slashed", label: "Bond slashed", done: true, active: true },
    ];
  }

  return [
    {
      id: "quoted",
      label: "Quote + bond locked by solver",
      done: intent.quote_count > 0 || locked || completed,
      active: intent.status === "Open" && intent.quote_count === 0,
    },
    {
      id: "selected",
      label: "Creator selects winner",
      done: locked || completed,
      active: intent.status === "Quoted",
    },
    {
      id: "derive",
      label: "Derive Chain Signatures BTC address",
      done: completed,
      active: locked && !completed,
    },
    {
      id: "fund",
      label: "Fund derived address (testnet faucet)",
      done: completed,
      active: locked && !completed,
    },
    {
      id: "settle",
      label: "MPC sign + broadcast + submit proof",
      done: completed,
      active: locked && !completed,
    },
  ];
}

export function urgency(
  intent: Pick<LiveIntent, "deadline_ms" | "status" | "bond_state">,
  now = Date.now()
): "ok" | "soon" | "late" {
  // Terminal outcomes are archives — no active slash-risk countdown.
  if (
    intent.status === "Completed" ||
    intent.status === "Failed" ||
    intent.status === "Expired" ||
    intent.bond_state === "Released" ||
    intent.bond_state === "Slashed"
  ) {
    return "ok";
  }
  const remaining = intent.deadline_ms - now;
  if (remaining <= 0) return "late";
  if (remaining < 5 * 60_000) return "soon";
  return "ok";
}
