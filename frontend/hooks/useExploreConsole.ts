"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveBook } from "@/hooks/useLiveBook";
import {
  ExploreLane,
  exploreLaneFor,
  exploreSharePath,
} from "@/lib/explore-ops";

export function useExploreConsole() {
  const live = useLiveBook();
  const router = useRouter();
  const searchParams = useSearchParams();
  const deepId = searchParams.get("id");

  const [selectedId, setSelectedIdState] = useState<string | null>(deepId);
  const [lane, setLane] = useState<ExploreLane>("all");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (deepId) setSelectedIdState(deepId);
  }, [deepId]);

  const intents = live.intents;

  const setSelectedId = (id: string | null) => {
    setSelectedIdState(id);
    const next = exploreSharePath(id);
    router.replace(next, { scroll: false });
  };

  const counts = useMemo(() => {
    const open = intents.filter((i) => exploreLaneFor(i) === "open").length;
    const settling = intents.filter(
      (i) => exploreLaneFor(i) === "settling"
    ).length;
    const settled = intents.filter((i) => exploreLaneFor(i) === "settled").length;
    const slashed = intents.filter((i) => exploreLaneFor(i) === "slashed").length;
    return {
      all: intents.length,
      open,
      settling,
      settled,
      slashed,
    };
  }, [intents]);

  const visible = useMemo(() => {
    let rows = intents;
    if (lane !== "all") {
      rows = rows.filter((i) => exploreLaneFor(i) === lane);
    }
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (i) =>
        i.intent_id.toLowerCase().includes(q) ||
        i.recipient_address.toLowerCase().includes(q) ||
        i.creator.toLowerCase().includes(q) ||
        (i.winner || "").toLowerCase().includes(q) ||
        (i.btc_tx_hash || "").toLowerCase().includes(q)
    );
  }, [intents, lane, query]);

  const selected = useMemo(() => {
    if (selectedId) {
      // Deep link / explicit pick: never silently swap to another settlement.
      return intents.find((i) => i.intent_id === selectedId) ?? null;
    }
    return visible[0] || null;
  }, [selectedId, intents, visible]);

  const copyShareLink = async () => {
    const id = selected?.intent_id || selectedId || null;
    const path = exploreSharePath(id);
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${path}`
        : path;
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (!ok && typeof document !== "undefined") {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      document.body.removeChild(ta);
    }
    setCopied(ok);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return {
    intents,
    visible,
    selected,
    selectedId,
    setSelectedId,
    lane,
    setLane,
    query,
    setQuery,
    counts,
    copied,
    copyShareLink,
    sharePath: exploreSharePath(selected?.intent_id ?? null),
    loading: live.loading,
    refreshing: live.refreshing,
    polling: live.polling,
    paused: live.paused,
    error: live.error,
    contractId: live.contractId,
    network: live.network,
    fetchedAt: live.fetchedAt,
    nextPollInMs: live.nextPollInMs,
    refresh: live.refresh,
  };
}
