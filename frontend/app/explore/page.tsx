"use client";

import { Suspense } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { BondBadge } from "@/components/BondBadge";
import { DashboardFrame } from "@/components/DashboardFrame";
import { DashPanel } from "@/components/DashPanel";
import { DeadlineClock } from "@/components/DeadlineClock";
import { ExploreHealthBar } from "@/components/ExploreHealthBar";
import { PreviewList } from "@/components/PreviewList";
import { QuoteList } from "@/components/QuoteList";
import { useExploreConsole } from "@/hooks/useExploreConsole";
import {
  deadlineNeedsUrgency,
  nearAccountUrl,
  settlementStory,
  type ExploreLane,
} from "@/lib/explore-ops";
import { mempoolUrl, yoctoToNear } from "@/lib/contract";
import { derivationPathFor } from "@/lib/solver-ops";

const LANES: { value: ExploreLane; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "settling", label: "Settling" },
  { value: "settled", label: "Settled" },
  { value: "slashed", label: "Slashed" },
];

function ExploreConsole() {
  const {
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
    loading,
    refreshing,
    polling,
    paused,
    error,
    contractId,
    network,
    fetchedAt,
    nextPollInMs,
    refresh,
  } = useExploreConsole();

  return (
    <AppShell>
      <DashboardFrame
        eyebrow="Feature · Explore"
        title="Explore settlements"
        description="Public transparency into bonded intents — quotes, collateral, Chain Signatures paths, and Bitcoin proofs."
        toolbar={
          <>
            <ExploreHealthBar
              network={network || "testnet"}
              contractId={contractId}
              counts={counts}
              lastRefreshAt={fetchedAt}
              nextPollInMs={nextPollInMs}
              polling={polling}
              paused={paused}
              refreshing={refreshing}
              error={error}
              onRefresh={() => void refresh()}
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search intent, recipient, creator, winner, BTC tx…"
                className="w-full border border-white/10 bg-navy-mid/80 px-4 py-3 text-sm outline-none focus:border-gold/50"
              />
              <div className="flex flex-wrap gap-2">
                {LANES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setLane(value)}
                    className={`border px-3 py-2 text-xs transition-colors ${
                      lane === value
                        ? "border-gold/50 bg-gold/10 text-gold"
                        : "border-white/10 text-mist/60 hover:border-gold/30 hover:text-gold"
                    }`}
                  >
                    {label}
                    <span className="ml-1 text-mist/40">{counts[value]}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        }
      >
        {loading ? (
          <div className="border border-white/10 px-5 py-10 text-sm text-mist/45">
            Fetching live settlements from NEAR…
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <DashPanel title="Settlements">
              <PreviewList
                items={visible}
                pinnedKey={selectedId}
                modalTitle="All settlements"
                empty={
                  <div className="space-y-3 px-5 py-10 text-sm text-mist/45">
                    <p>No live settlements match this filter.</p>
                    <p>
                      Post one from the{" "}
                      <Link
                        href="/app"
                        className="text-gold hover:text-gold-soft"
                      >
                        Create console
                      </Link>
                      .
                    </p>
                  </div>
                }
                getKey={(intent) => intent.intent_id}
                renderItem={(intent, _index, { closeModal }) => {
                  const active = intent.intent_id === selectedId;
                  const urgent = deadlineNeedsUrgency(intent);
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(intent.intent_id);
                        closeModal();
                      }}
                      className={`flex w-full items-start justify-between gap-3 px-4 py-4 text-left transition-colors ${
                        active ? "bg-gold/10" : "hover:bg-white/[0.03]"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-mist/50">
                          {intent.intent_id}
                        </p>
                        <p className="mt-1 font-display text-xl text-mist">
                          {intent.status}
                        </p>
                        <p className="mt-2 truncate font-mono text-xs text-mist/45">
                          {intent.amount_min} sats → {intent.recipient_address}
                        </p>
                        <div className="mt-2">
                          <DeadlineClock
                            deadlineMs={intent.deadline_ms}
                            urgency={urgent}
                          />
                        </div>
                      </div>
                      <BondBadge state={intent.bond_state} />
                    </button>
                  );
                }}
              />
            </DashPanel>

            <div className="space-y-4">
              {!selected ? (
                <DashPanel title="Detail">
                  <p className="px-4 py-8 text-sm text-mist/45">
                    {selectedId
                      ? loading
                        ? `Looking up ${selectedId}…`
                        : `No live settlement matches ${selectedId}. Pick another row or clear the link.`
                      : "Select a settlement to inspect bond state, quotes, and proofs."}
                  </p>
                </DashPanel>
              ) : (
                <>
                  <DashPanel
                    title="Selected"
                    action={
                      <button
                        type="button"
                        onClick={() => void copyShareLink()}
                        className="text-xs text-gold transition-colors hover:text-gold-soft"
                      >
                        {copied ? "Copied" : "Share link"}
                      </button>
                    }
                  >
                    <div className="space-y-4 px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-xs text-mist/60">
                            {selected.intent_id}
                          </p>
                          <p className="mt-1 font-display text-2xl text-mist">
                            {selected.status}
                          </p>
                        </div>
                        <BondBadge state={selected.bond_state} />
                      </div>
                      <p className="text-sm text-mist/65">
                        {settlementStory(selected)}
                      </p>
                      <DeadlineClock
                        deadlineMs={selected.deadline_ms}
                        urgency={deadlineNeedsUrgency(selected)}
                      />
                    </div>
                  </DashPanel>

                  <DashPanel title="Settlement facts">
                    <dl className="grid gap-3 px-4 py-4 text-xs text-mist/55 sm:grid-cols-2">
                      <div>
                        <dt className="uppercase tracking-[0.14em]">Creator</dt>
                        <dd className="mt-1 truncate">
                          <a
                            className="font-mono text-gold/90 hover:text-gold"
                            href={nearAccountUrl(selected.creator)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {selected.creator}
                          </a>
                        </dd>
                      </div>
                      <div>
                        <dt className="uppercase tracking-[0.14em]">Winner</dt>
                        <dd className="mt-1 truncate">
                          {selected.winner ? (
                            <a
                              className="font-mono text-gold/90 hover:text-gold"
                              href={nearAccountUrl(selected.winner)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {selected.winner}
                            </a>
                          ) : (
                            "—"
                          )}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="uppercase tracking-[0.14em]">
                          BTC recipient
                        </dt>
                        <dd className="mt-1 break-all font-mono text-mist/85">
                          {selected.recipient_address}
                        </dd>
                      </div>
                      <div>
                        <dt className="uppercase tracking-[0.14em]">
                          Min amount
                        </dt>
                        <dd className="mt-1 text-mist/85">
                          {selected.amount_min} sats
                        </dd>
                      </div>
                      <div>
                        <dt className="uppercase tracking-[0.14em]">
                          Locked bond
                        </dt>
                        <dd className="mt-1 text-mist/85">
                          {yoctoToNear(selected.locked_bond)} NEAR
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="uppercase tracking-[0.14em]">
                          Chain Signatures path
                        </dt>
                        <dd className="mt-1 break-all font-mono text-mist/85">
                          {derivationPathFor(selected)}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="uppercase tracking-[0.14em]">
                          Bitcoin proof
                        </dt>
                        <dd className="mt-1">
                          {selected.btc_tx_hash ? (
                            <a
                              className="break-all font-mono text-gold hover:text-gold-soft"
                              href={mempoolUrl(selected.btc_tx_hash)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {selected.btc_tx_hash}
                            </a>
                          ) : (
                            <span className="text-mist/45">No proof yet</span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </DashPanel>

                  <DashPanel title="Bonded quotes">
                    <div className="px-4 py-4">
                      <QuoteList quotes={selected.quotes} />
                    </div>
                  </DashPanel>
                </>
              )}
            </div>
          </div>
        )}
      </DashboardFrame>
    </AppShell>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <main className="mx-auto max-w-6xl px-6 py-16 text-sm text-mist/45">
            Loading explore…
          </main>
        </AppShell>
      }
    >
      <ExploreConsole />
    </Suspense>
  );
}
