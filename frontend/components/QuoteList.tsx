import { QuoteView, yoctoToNear } from "@/lib/contract";

function asBigInt(value: string) {
  try {
    return BigInt(value || "0");
  } catch {
    return 0n;
  }
}

function rankQuotes(quotes: QuoteView[]) {
  return [...quotes].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    const amountDiff = asBigInt(b.quoted_amount) - asBigInt(a.quoted_amount);
    if (amountDiff !== 0n) return amountDiff > 0n ? 1 : -1;
    const bondDiff = asBigInt(b.bond_amount) - asBigInt(a.bond_amount);
    if (bondDiff !== 0n) return bondDiff > 0n ? 1 : -1;
    return b.submitted_at_ms - a.submitted_at_ms;
  });
}

export function QuoteList({ quotes }: { quotes: QuoteView[] }) {
  if (!quotes.length) {
    return (
      <p className="text-sm text-mist/45">
        No bonded quotes on this intent yet.
      </p>
    );
  }

  const ranked = rankQuotes(quotes);
  const bestActive = ranked.find((q) => q.active);

  return (
    <ul className="divide-y divide-white/5 border border-white/10">
      {ranked.map((q, i) => {
        const isBest =
          bestActive &&
          q.active &&
          q.solver === bestActive.solver &&
          q.submitted_at_ms === bestActive.submitted_at_ms;
        return (
          <li
            key={`${q.solver}-${q.submitted_at_ms}-${i}`}
            className={`flex flex-col justify-between gap-3 px-4 py-3 sm:flex-row sm:items-center ${
              q.active ? "" : "opacity-40"
            }`}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium text-mist">{q.solver}</p>
                {isBest ? (
                  <span className="border border-gold/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-gold">
                    Best quote
                  </span>
                ) : null}
                {!q.active ? (
                  <span className="border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-mist/45">
                    Inactive
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-mist/45">
                Quoted {q.quoted_amount} sats ·{" "}
                {new Date(q.submitted_at_ms).toLocaleTimeString()}
              </p>
            </div>
            <p className="font-display text-xl text-gold">
              {yoctoToNear(q.bond_amount)}{" "}
              <span className="font-sans text-sm text-mist/50">NEAR bond</span>
            </p>
          </li>
        );
      })}
    </ul>
  );
}
