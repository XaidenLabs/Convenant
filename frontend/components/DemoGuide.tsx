"use client";

import { currentStep, type MockIntent } from "@/lib/mock-store";

const STEPS = [
  { id: "post", label: "Post intent" },
  { id: "quote", label: "Solver quotes and locks bond" },
  { id: "select", label: "Select winner" },
  { id: "settle_or_slash", label: "Settle BTC or Simulate Failure" },
  { id: "done", label: "Done" },
] as const;

export function DemoGuide({
  intent,
  localMode,
  onRunHappyPath,
  onRunSlashPath,
  busy,
}: {
  intent: MockIntent | null;
  localMode: boolean;
  onRunHappyPath: () => void;
  onRunSlashPath: () => void;
  busy?: boolean;
}) {
  const step = currentStep(intent);
  const stepIdx = STEPS.findIndex((item) => item.id === step);

  return (
    <div className="space-y-4 px-4 py-4">
      <div>
        <p className="font-display text-xl text-mist">Two paths, one model</p>
        <p className="mt-1 text-sm leading-relaxed text-mist/55">
          {localMode
            ? "Local stub — same bond states, no keys required."
            : "Live contract — one-click paths still work for rehearsal."}
        </p>
      </div>

      <ol className="grid gap-2 sm:grid-cols-5">
        {STEPS.map((item, index) => {
          const isActive = index === stepIdx;
          const isDone = index < stepIdx;
          return (
            <li
              key={item.id}
              className={`text-xs ${
                isActive
                  ? "text-gold"
                  : isDone
                    ? "text-mist/70"
                    : "text-mist/35"
              }`}
            >
              <span className="font-mono text-[10px] tracking-wide">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="mt-1 leading-snug">{item.label}</p>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={busy}
          onClick={onRunHappyPath}
          className="bg-gold px-4 py-2.5 text-sm font-semibold text-navy-deep transition-colors hover:bg-gold-soft disabled:opacity-50"
        >
          Run happy path
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onRunSlashPath}
          className="border border-red-400/50 px-4 py-2.5 text-sm text-red-300 transition-colors hover:bg-red-400/10 disabled:opacity-50"
        >
          Run slash path
        </button>
      </div>
    </div>
  );
}
