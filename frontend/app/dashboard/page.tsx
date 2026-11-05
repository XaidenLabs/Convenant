"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { BondBadge } from "@/components/BondBadge";
import { DashPanel } from "@/components/DashPanel";
import { PreviewList } from "@/components/PreviewList";
import { useLiveBook } from "@/hooks/useLiveBook";
import { exploreLaneFor } from "@/lib/explore-ops";
import { yoctoToNear } from "@/lib/contract";

export default function DashboardOverviewPage() {
  const live = useLiveBook();
  const intents = live.intents;

  const open = intents.filter((i) => exploreLaneFor(i) === "open").length;
  const settling = intents.filter((i) => exploreLaneFor(i) === "settling").length;
  const settled = intents.filter((i) => exploreLaneFor(i) === "settled").length;
  const slashed = intents.filter((i) => exploreLaneFor(i) === "slashed").length;
  const locked = intents
    .filter((i) => i.bond_state === "Locked")
    .reduce((acc, i) => {
      try {
        return acc + BigInt(i.locked_bond || "0");
      } catch {
        return acc;
      }
    }, 0n);

  const metrics = [
    { label: "Live intents", value: String(intents.length) },
    { label: "Open / quoted", value: String(open) },
    { label: "Settling", value: String(settling) },
    { label: "Settled", value: String(settled) },
    { label: "Slashed", value: String(slashed) },
    { label: "Locked bond", value: `${yoctoToNear(locked.toString())} N` },
  ];

  return (
    <AppShell>
      <main className="space-y-6 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-gold/80">
              Overview
            </p>
            <p className="mt-2 max-w-2xl text-sm text-mist/60">
              Live pulse of the bonded marketplace — contract views only, no
              seed rows. Jump into Create, Solve, or Explore from the sidebar.
            </p>
          </div>
          <p className="text-xs text-mist/45">
            {live.paused
              ? "Polling paused"
              : live.refreshing
                ? "Fetching live…"
                : live.polling
                  ? `Live · next ${Math.ceil(live.nextPollInMs / 1000)}s`
                  : "Idle"}
            {" · "}
            <button
              type="button"
              onClick={() => void live.refresh()}
              className="text-gold hover:text-gold-soft"
            >
              Refresh
            </button>
          </p>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="border border-white/10 bg-navy/30 px-4 py-4"
            >
              <p className="text-[10px] uppercase tracking-[0.16em] text-mist/40">
                {m.label}
              </p>
              <p className="mt-2 font-display text-3xl text-mist">{m.value}</p>
            </div>
          ))}
        </section>

        {live.error ? (
          <p className="border border-red-400/30 bg-red-400/5 px-4 py-3 text-sm text-red-300">
            {live.error}
          </p>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_0.8fr]">
          <DashPanel
            title="Recent settlements"
            action={
              <Link
                href="/explore"
                className="text-xs text-gold hover:text-gold-soft"
              >
                Open Explore
              </Link>
            }
          >
            <PreviewList
              items={intents}
              modalTitle="All live intents"
              empty={
                <p className="px-4 py-8 text-sm text-mist/45">
                  {live.loading
                    ? "Loading live intents…"
                    : "No live intents yet. Create one to see the book move."}
                </p>
              }
              getKey={(intent) => intent.intent_id}
              renderItem={(intent) => (
                <Link
                  href={`/explore?id=${encodeURIComponent(intent.intent_id)}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs text-mist/55">
                      {intent.intent_id}
                    </p>
                    <p className="mt-1 text-sm text-mist">
                      {intent.status} · {intent.amount_min} sats
                    </p>
                  </div>
                  <BondBadge state={intent.bond_state} />
                </Link>
              )}
            />
          </DashPanel>

          <div className="space-y-4">
            <DashPanel title="Quick actions">
              <div className="grid gap-2 px-4 py-4">
                <Link
                  href="/app"
                  className="bg-gold px-4 py-3 text-center text-sm font-semibold text-navy-deep transition-colors hover:bg-gold-soft"
                >
                  Create · post intent
                </Link>
                <Link
                  href="/solver"
                  className="border border-white/15 px-4 py-3 text-center text-sm text-mist/80 transition-colors hover:border-gold/40 hover:text-gold"
                >
                  Solve · open book
                </Link>
                <Link
                  href="/explore"
                  className="border border-white/15 px-4 py-3 text-center text-sm text-mist/80 transition-colors hover:border-gold/40 hover:text-gold"
                >
                  Explore · transparency
                </Link>
                <Link
                  href="/protocol"
                  className="border border-white/15 px-4 py-3 text-center text-sm text-mist/80 transition-colors hover:border-gold/40 hover:text-gold"
                >
                  Protocol · architecture
                </Link>
              </div>
            </DashPanel>

            <DashPanel title="Source">
              <div className="space-y-2 px-4 py-4 text-xs text-mist/55">
                <p>
                  Network{" "}
                  <strong className="text-mist/85">
                    {live.network || "testnet"}
                  </strong>
                </p>
                <p className="break-all font-mono text-gold/85">
                  {live.contractId || "—"}
                </p>
                <p>
                  Last fetch{" "}
                  {live.fetchedAt
                    ? new Date(live.fetchedAt).toLocaleTimeString()
                    : "—"}
                </p>
              </div>
            </DashPanel>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
