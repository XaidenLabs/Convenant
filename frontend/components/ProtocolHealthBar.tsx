"use client";

function formatEta(ms: number) {
  const sec = Math.ceil(ms / 1000);
  if (sec <= 0) return "now";
  return `${sec}s`;
}

export function ProtocolHealthBar({
  online,
  source,
  network,
  contractId,
  indexerUrl,
  syncing,
  refreshing,
  nextPollInMs,
  lastRefreshAt,
  lastSyncAt,
  intentCount,
  pollMs,
  error,
  offlineNote,
  onRefresh,
  onSync,
}: {
  online: boolean;
  source: "indexer" | "live-book" | "unknown";
  network: string;
  contractId: string;
  indexerUrl: string;
  syncing?: boolean;
  refreshing?: boolean;
  nextPollInMs: number;
  lastRefreshAt: number | null;
  lastSyncAt: number | null;
  intentCount: number;
  pollMs: number | null;
  error: string | null;
  offlineNote: string | null;
  onRefresh: () => void;
  onSync: () => void;
}) {
  const statusLabel = !online
    ? "Indexer offline"
    : syncing
      ? "Indexer syncing…"
      : refreshing
        ? "Refreshing…"
        : "Indexer online";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border border-white/10 bg-navy/40 px-4 py-3 text-xs text-mist/55">
        <span className="inline-flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              !online
                ? "bg-mist/40"
                : error
                  ? "bg-gold"
                  : syncing || refreshing
                    ? "bg-gold animate-pulse"
                    : "bg-emerald-400"
            }`}
            aria-hidden
          />
          <strong className="text-mist/85">{statusLabel}</strong>
        </span>
        <span className="hidden h-3 w-px bg-white/10 sm:block" />
        <span>
          Stats via{" "}
          <strong className="text-mist/85">
            {source === "indexer"
              ? "Indexer API"
              : source === "live-book"
                ? "Live NEAR views"
                : "—"}
          </strong>
        </span>
        <span className="hidden h-3 w-px bg-white/10 sm:block" />
        <span>
          NEAR <strong className="text-emerald-300">{network}</strong>
        </span>
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
          Indexed{" "}
          <strong className="text-mist/85">{intentCount}</strong>
        </span>
        {pollMs ? (
          <span>
            Cadence{" "}
            <strong className="text-mist/85">{Math.round(pollMs / 1000)}s</strong>
          </span>
        ) : null}
        <span>
          Last{" "}
          <strong className="text-mist/85">
            {lastRefreshAt
              ? new Date(lastRefreshAt).toLocaleTimeString()
              : "—"}
          </strong>
        </span>
        <span>
          Next{" "}
          <strong className="text-mist/85">{formatEta(nextPollInMs)}</strong>
        </span>
        {lastSyncAt ? (
          <span>
            Chain sync{" "}
            <strong className="text-mist/85">
              {new Date(lastSyncAt).toLocaleTimeString()}
            </strong>
          </span>
        ) : null}
        <span className="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="border border-white/15 px-3 py-1 text-mist/75 transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <button
            type="button"
            onClick={onSync}
            disabled={!online || syncing}
            className="border border-white/15 px-3 py-1 text-mist/75 transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
            title={
              online
                ? `POST ${indexerUrl}/v1/sync`
                : "Start the indexer to enable sync"
            }
          >
            {syncing ? "Syncing…" : "Sync now"}
          </button>
        </span>
      </div>
      {offlineNote ? (
        <p className="border border-white/10 bg-navy/30 px-4 py-2 text-sm text-mist/55">
          {offlineNote}. Start with{" "}
          <code className="text-gold/90">npm run indexer:dev</code> (
          <span className="font-mono text-mist/70">{indexerUrl}</span>).
        </p>
      ) : null}
      {error ? (
        <p className="border border-gold/30 bg-gold/5 px-4 py-2 text-sm text-gold">
          Last indexer sync warning: {error}
        </p>
      ) : null}
    </div>
  );
}
