import type { BondState } from "@/lib/contract";

const STYLES: Record<BondState, string> = {
  None: "border-white/15 text-mist/60",
  Locked: "border-gold/60 text-gold animate-pulse-gold",
  Released: "border-emerald-400/50 text-emerald-300",
  Slashed: "border-red-400/60 text-red-300",
};

export function BondBadge({ state }: { state: BondState }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-sm border px-3 py-1 text-xs font-medium tracking-[0.14em] uppercase ${STYLES[state]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          state === "Locked"
            ? "bg-gold"
            : state === "Released"
              ? "bg-emerald-400"
              : state === "Slashed"
                ? "bg-red-400"
                : "bg-mist/40"
        }`}
      />
      Bond {state}
    </span>
  );
}
