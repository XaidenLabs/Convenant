"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { DashboardFrame } from "@/components/DashboardFrame";
import { DashPanel } from "@/components/DashPanel";
import { PreviewList } from "@/components/PreviewList";
import { ProtocolHealthBar } from "@/components/ProtocolHealthBar";
import { useProtocolConsole } from "@/hooks/useProtocolConsole";
import { useLiveBook } from "@/hooks/useLiveBook";
import { BondBadge } from "@/components/BondBadge";

const SURFACES = [
  {
    href: "/app",
    title: "Create",
    body: "Post intents, rank bonded quotes, select winners, settle or slash.",
  },
  {
    href: "/solver",
    title: "Solve",
    body: "Live open book, settlement checklist, Chain Signatures worker commands.",
  },
  {
    href: "/explore",
    title: "Explore",
    body: "Public transparency — bonds, proofs, and shareable settlement links.",
  },
  {
    href: "/protocol",
    title: "Protocol",
    body: "Architecture for judges and agents — read path, write path, auth.",
  },
];

export default function ProtocolPage() {
  const proto = useProtocolConsole();
  const live = useLiveBook();

  return (
    <AppShell>
      <DashboardFrame
        eyebrow="Feature · Protocol"
        title="Built to scale the enforcement problem"
        description="Role-separated surfaces, a scalable indexer read path, and an on-chain write path that remains the bond source of truth."
        toolbar={
          <>
            <ProtocolHealthBar
              online={proto.online}
              source={proto.source}
              network={proto.network}
              contractId={proto.contractId}
              indexerUrl={proto.indexerUrl}
              syncing={proto.syncing}
              refreshing={proto.refreshing}
              nextPollInMs={proto.nextPollInMs}
              lastRefreshAt={proto.fetchedAt}
              lastSyncAt={proto.health?.last_sync_at_ms || null}
              intentCount={proto.stats.intent_count}
              pollMs={proto.health?.poll_ms ?? null}
              error={proto.error}
              offlineNote={proto.offlineNote}
              onRefresh={proto.refresh}
              onSync={proto.syncNow}
            />
            {proto.syncMessage ? (
              <p className="text-sm text-gold">{proto.syncMessage}</p>
            ) : null}
          </>
        }
      >
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="space-y-4">
            <DashPanel title="Live protocol stats">
              <div className="grid gap-3 px-4 py-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ["Intents", proto.stats.intent_count],
                  ["Open / quoted", proto.stats.open_count],
                  ["Completed", proto.stats.completed_count],
                  ["Slashed / failed", proto.stats.slashed_count],
                  ["Locked bond", `${proto.lockedNear} N`],
                ].map(([label, value]) => (
                  <div key={String(label)} className="border-t border-white/10 pt-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-mist/40">
                      {label}
                    </p>
                    <p className="mt-2 font-display text-3xl text-mist">{value}</p>
                  </div>
                ))}
              </div>
            </DashPanel>

            <DashPanel title="System map">
              <pre className="overflow-x-auto px-4 py-4 font-mono text-[11px] leading-5 text-mist/75">{`
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Landing  │  │ Create   │  │ Solve    │  │ Explore  │
└────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     └─────────────┴─────────────┴─────────────┘
                           │
                           ▼
                 ┌─────────────────────┐
                 │ Indexer API  :8787  │  ← scalable reads
                 │ /v1/intents /stats  │
                 └──────────┬──────────┘
                            │ poll views
                            ▼
                 ┌─────────────────────┐
                 │ Covenant contract   │  ← write / bond truth
                 │ NEAR testnet        │
                 └──────────┬──────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
     ┌────────────────┐         ┌────────────────────┐
     │ Solver workers │         │ MPC v1.signer-prod │
     │ quote / settle │────────▶│ Chain Signatures   │
     └───────┬────────┘         └─────────┬──────────┘
             │                            │
             └─────────── BTC tx ─────────┘
`}</pre>
            </DashPanel>

            <div className="grid gap-4 md:grid-cols-3">
              <DashPanel title="Surfaces">
                <ul className="space-y-4 px-4 py-4">
                  {SURFACES.map((s) => (
                    <li key={s.href}>
                      <Link
                        href={s.href}
                        className="font-medium text-gold hover:text-gold-soft"
                      >
                        {s.title}
                      </Link>
                      <p className="mt-1 text-sm text-mist/55">{s.body}</p>
                    </li>
                  ))}
                </ul>
              </DashPanel>
              <DashPanel title="Read path">
                <ul className="space-y-3 px-4 py-4 text-sm leading-relaxed text-mist/60">
                  <li>Indexer polls NEAR views into a durable store.</li>
                  <li>
                    REST <code className="text-mist/80">/v1/intents</code> +{" "}
                    <code className="text-mist/80">/v1/stats</code>.
                  </li>
                  <li>UI keeps a shared continuous live-book poller.</li>
                  <li>Swap file store → Postgres later without API churn.</li>
                </ul>
              </DashPanel>
              <DashPanel title="Write path">
                <ul className="space-y-3 px-4 py-4 text-sm leading-relaxed text-mist/60">
                  <li>NEAR contract is bond/status source of truth.</li>
                  <li>Creators: wallet. Solvers: worker keys.</li>
                  <li>Chain Signatures MPC signs native BTC.</li>
                  <li>Slash / handover is on-chain.</li>
                </ul>
              </DashPanel>
            </div>

            <DashPanel title="Auth stays intentional">
              <div className="space-y-4 px-4 py-4">
                <p className="max-w-2xl text-sm text-mist/60">
                  No account system. Wallet signatures for creators, worker keys
                  for solvers, nothing for BTC recipients.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/app"
                    className="inline-flex h-10 items-center bg-gold px-5 text-sm font-semibold text-navy-deep hover:bg-gold-soft"
                  >
                    Create
                  </Link>
                  <Link
                    href="/explore"
                    className="inline-flex h-10 items-center border border-white/15 px-5 text-sm text-mist/80 hover:border-gold/40 hover:text-gold"
                  >
                    Explore
                  </Link>
                  <Link
                    href="/solver"
                    className="inline-flex h-10 items-center border border-white/15 px-5 text-sm text-mist/80 hover:border-gold/40 hover:text-gold"
                  >
                    Solve
                  </Link>
                </div>
              </div>
            </DashPanel>
          </div>

          <DashPanel title="Recent live intents">
            <PreviewList
              items={live.intents}
              modalTitle="All live intents"
              empty={
                <p className="px-4 py-8 text-sm text-mist/45">
                  {live.loading
                    ? "Loading live intents…"
                    : "No live intents on the contract yet."}
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
                    <p className="mt-1 text-sm text-mist">{intent.status}</p>
                  </div>
                  <BondBadge state={intent.bond_state} />
                </Link>
              )}
            />
          </DashPanel>
        </div>
      </DashboardFrame>
    </AppShell>
  );
}
