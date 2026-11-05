"use client";

import { useMemo, useState } from "react";
import { useLiveBook } from "@/hooks/useLiveBook";
import { laneFor, urgency } from "@/lib/solver-ops";

export type SolverFilter = "all" | "open" | "settling" | "terminal";

export function useSolverConsole() {
  const live = useLiveBook();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<SolverFilter>("all");
  const [query, setQuery] = useState("");

  const intents = live.intents;

  const openBook = useMemo(
    () => intents.filter((i) => laneFor(i) === "open"),
    [intents]
  );
  const settling = useMemo(
    () => intents.filter((i) => laneFor(i) === "settling"),
    [intents]
  );
  const terminal = useMemo(
    () => intents.filter((i) => laneFor(i) === "terminal"),
    [intents]
  );

  const visible = useMemo(() => {
    let rows = intents;
    if (filter === "open") rows = openBook;
    if (filter === "settling") rows = settling;
    if (filter === "terminal") rows = terminal;
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (i) =>
        i.intent_id.toLowerCase().includes(q) ||
        i.recipient_address.toLowerCase().includes(q) ||
        (i.winner || "").toLowerCase().includes(q) ||
        i.creator.toLowerCase().includes(q)
    );
  }, [intents, filter, query, openBook, settling, terminal]);

  const selected = useMemo(() => {
    if (selectedId) {
      // Sticky selection — do not jump when a newer row appears on poll.
      return intents.find((i) => i.intent_id === selectedId) ?? null;
    }
    return (
      settling[0] ||
      openBook[0] ||
      visible[0] ||
      intents[0] ||
      null
    );
  }, [selectedId, intents, settling, openBook, visible]);

  const urgentSettling = settling.filter((i) => urgency(i) !== "ok");

  return {
    intents,
    visible,
    openBook,
    settling,
    terminal,
    selected,
    selectedId,
    setSelectedId,
    filter,
    setFilter,
    query,
    setQuery,
    loading: live.loading,
    refreshing: live.refreshing,
    polling: live.polling,
    paused: live.paused,
    error: live.error,
    contractId: live.contractId,
    network: live.network,
    fetchedAt: live.fetchedAt,
    nextPollInMs: live.nextPollInMs,
    consecutiveErrors: live.consecutiveErrors,
    urgentSettling,
    refresh: live.refresh,
  };
}
