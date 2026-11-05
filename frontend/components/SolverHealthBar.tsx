"use client";

function formatEta(ms: number) {
  const sec = Math.ceil(ms / 1000);
  if (sec <= 0) return "now";
  return `${sec}s`;
}

export function SolverHealthBar({
  network,
  contractId,
  openCount,
  settlingCount,
  terminalCount,
  lastRefreshAt,
  nextPollInMs,
  polling,
  paused,
  refreshing,
  error,
  onRefresh,
}: {
  network: string;
  contractId: string;
  openCount: number;
  settlingCount: number;
  terminalCount: number;
  lastRefreshAt: number | null;
  nextPollInMs: number;
  polling: boolean;
  paused: boolean;
  refreshing?: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border border-white/10 bg-navy/40 px-4 py-3 text-xs text-mist/55">
        <span className="inline-flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              error
                ? "bg-red-400"
                : paused
                  ? "bg-mist/40"
                  : refreshing
                    ? "bg-gold animate-pulse"
                    : "bg-emerald-400"
            }`}
            aria-hidden
          />
          <strong className="text-mist/85">
            {paused
              ? "Paused (tab hidden)"
              : refreshing
                ? "Fetching live…"
                : polling
                  ? "Live polling"
                  : "Idle"}
          </strong>
        </span>
        <span className="hidden h-3 w-px bg-white/10 sm:block" />
        <span>
          Source <strong className="text-emerald-300">NEAR {network}</strong>
        </span>
        <span className="hidden h-3 w-px bg-white/10 sm:block" />
        <a
          className="max-w-full truncate font-mono text-gold/90 hover:text-gold"
          href={`https://testnet.nearblocks.io/address/${contractId}`}
          target="_blank"
          rel="noreferrer"
        >
          {contractId || "—"}
        </a>
        <span className="hidden h-3 w-px bg-white/10 sm:block" />
        <span>
          Open <strong className="text-mist/85">{openCount}</strong>
        </span>
        <span>
          Settling <strong className="text-mist/85">{settlingCount}</strong>
        </span>
        <span>
          Terminal <strong className="text-mist/85">{terminalCount}</strong>
        </span>
        <span className="hidden h-3 w-px bg-white/10 sm:block" />
        <span>
          Last{" "}
          <strong className="text-mist/85">
            {lastRefreshAt ? new Date(lastRefreshAt).toLocaleTimeString() : "—"}
          </strong>
        </span>
        <span>
          Next{" "}
          <strong className="text-mist/85">
            {paused ? "—" : formatEta(nextPollInMs)}
          </strong>
        </span>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="ml-auto border border-white/15 px-3 py-1 text-mist/75 transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
        >
          {refreshing ? "Refreshing…" : "Refresh now"}
        </button>
      </div>
      {error ? (
        <p className="border border-red-400/30 bg-red-400/5 px-4 py-2 text-sm text-red-300">
          Live fetch issue (keeping last good book if available): {error}
        </p>
      ) : null}
    </div>
  );
}
