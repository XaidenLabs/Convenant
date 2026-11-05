"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IndexerHealth,
  ProtocolStats,
  fetchHealth,
  fetchStats,
  indexerBaseUrl,
  triggerIndexerSync,
} from "@/lib/indexer";
import { useLiveBook } from "@/hooks/useLiveBook";
import { yoctoToNear } from "@/lib/contract";

const POLL_MS = 8_000;

export type ProtocolSource = "indexer" | "live-book" | "unknown";

export function useProtocolConsole() {
  const live = useLiveBook();
  const [health, setHealth] = useState<IndexerHealth | null>(null);
  const [stats, setStats] = useState<ProtocolStats | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [nextPollAt, setNextPollAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const refresh = useCallback(async (soft = true) => {
    if (soft) setRefreshing(true);
    else setLoading(true);
    try {
      const [h, s] = await Promise.all([fetchHealth(), fetchStats()]);
      if (h?.ok) {
        setHealth(h);
        setStats(s);
        setOnline(true);
        setError(h.last_error);
      } else {
        setHealth(null);
        setStats(null);
        setOnline(false);
        setError(null);
      }
      setFetchedAt(Date.now());
    } catch (err) {
      setOnline(false);
      setHealth(null);
      setStats(null);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setNextPollAt(Date.now() + POLL_MS);
    }
  }, []);

  useEffect(() => {
    void refresh(false);
    const id = setInterval(() => void refresh(true), POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const syncNow = useCallback(async () => {
    setSyncing(true);
    setSyncMessage(null);
    const result = await triggerIndexerSync();
    if (result?.error) {
      setSyncMessage(result.error);
    } else {
      setSyncMessage(`Synced ${result?.synced ?? 0} intents from chain`);
    }
    await refresh(true);
    setSyncing(false);
    window.setTimeout(() => setSyncMessage(null), 4000);
  }, [refresh]);

  const liveStats = useMemo(() => {
    const intents = live.intents;
    const locked = intents
      .filter((i) => i.bond_state === "Locked")
      .reduce((acc, i) => {
        try {
          return acc + BigInt(i.locked_bond || "0");
        } catch {
          return acc;
        }
      }, 0n);
    return {
      network: live.network || "testnet",
      contract_id: live.contractId,
      intent_count: intents.length,
      open_count: intents.filter(
        (i) => i.status === "Open" || i.status === "Quoted"
      ).length,
      completed_count: intents.filter((i) => i.status === "Completed").length,
      slashed_count: intents.filter(
        (i) => i.bond_state === "Slashed" || i.status === "Failed"
      ).length,
      locked_bond_yocto: locked.toString(),
      indexed_at_ms: live.fetchedAt || Date.now(),
    } satisfies ProtocolStats;
  }, [live]);

  const source: ProtocolSource =
    online === true
      ? "indexer"
      : live.intents.length || live.fetchedAt
        ? "live-book"
        : "unknown";

  const displayStats = online && stats ? stats : liveStats;
  const chainSyncing = Boolean(health?.syncing);

  return {
    online: online === true,
    source,
    health,
    stats: displayStats,
    lockedNear: yoctoToNear(displayStats.locked_bond_yocto || "0"),
    loading: (online === null || loading) && !live.fetchedAt,
    refreshing,
    syncing: syncing || chainSyncing,
    syncMessage,
    error: online === true ? error : null,
    offlineNote:
      online === false
        ? "Indexer offline — showing live NEAR book stats as fallback"
        : null,
    fetchedAt,
    nextPollInMs: Math.max(0, nextPollAt - now),
    indexerUrl: indexerBaseUrl(),
    contractId: displayStats.contract_id || live.contractId,
    network: displayStats.network || live.network || "testnet",
    refresh: () => void refresh(true),
    syncNow: () => void syncNow(),
    livePolling: live.polling,
    livePaused: live.paused,
  };
}
