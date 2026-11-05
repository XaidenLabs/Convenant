"use client";

import type { BondState, IntentStatus } from "@/lib/contract";

const STAGES: { status: IntentStatus | "Bond"; label: string }[] = [
  { status: "Open", label: "Intent" },
  { status: "Quoted", label: "Quoted" },
  { status: "Selected", label: "Bond locked" },
  { status: "Completed", label: "Settled" },
];

function stageIndex(status: IntentStatus, bond: BondState): number {
  if (status === "Failed" || bond === "Slashed") return -1;
  if (status === "Open") return 0;
  if (status === "Quoted") return 1;
  if (status === "Selected" || status === "Settling") return 2;
  if (status === "Completed" || bond === "Released") return 3;
  return 0;
}

export function SettlementTimeline({
  status,
  bond,
}: {
  status: IntentStatus;
  bond: BondState;
}) {
  const failed = status === "Failed" || bond === "Slashed";
  const current = stageIndex(status, bond);

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-[0.16em] text-mist/45">
        Settlement timeline
      </p>
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STAGES.map((stage, index) => {
          const done = !failed && current >= index;
          const active = !failed && current === index;
          return (
            <li
              key={stage.label}
              className={`border px-3 py-2 text-xs ${
                failed
                  ? "border-red-400/25 text-mist/35"
                  : active
                    ? "border-gold/50 bg-gold/10 text-gold"
                    : done
                      ? "border-emerald-400/30 text-emerald-300/90"
                      : "border-white/10 text-mist/35"
              }`}
            >
              <span className="font-mono text-[10px] opacity-70">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="mt-1 font-medium">{stage.label}</p>
            </li>
          );
        })}
      </ol>
      {failed ? (
        <p className="text-sm text-red-300/90">
          Path ended in slash — bond moved to treasury; intent failed or
          reopened for the next quote.
        </p>
      ) : null}
    </div>
  );
}
