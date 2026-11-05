"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LiveBookPollerStatus,
  liveBookPoller,
} from "@/lib/live-book-poller";
import type { LiveBookSnapshot } from "@/lib/live-book";

const EMPTY: LiveBookPollerStatus = {
  snapshot: null,
  loading: true,
  refreshing: false,
  consecutiveErrors: 0,
  nextPollAt: 0,
  polling: false,
  paused: false,
};

/**
 * Subscribe to the shared continuous live-book poller.
 * Multiple pages share one NEAR fetch loop.
 */
export function useLiveBook() {
  const [status, setStatus] = useState<LiveBookPollerStatus>(EMPTY);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => liveBookPoller.subscribe(setStatus), []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const refresh = useCallback(async () => {
    await liveBookPoller.refreshNow();
  }, []);

  const snapshot: LiveBookSnapshot | null = status.snapshot;

  return {
    intents: snapshot?.intents ?? [],
    contractId: snapshot?.contract_id ?? "",
    network: snapshot?.network ?? "",
    fetchedAt: snapshot?.fetched_at_ms ?? null,
    error: snapshot?.error ?? null,
    loading: status.loading,
    refreshing: status.refreshing,
    polling: status.polling,
    paused: status.paused,
    consecutiveErrors: status.consecutiveErrors,
    nextPollInMs: Math.max(0, status.nextPollAt - now),
    refresh,
  };
}
