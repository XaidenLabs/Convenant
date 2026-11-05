"use client";

import { AppShell } from "@/components/AppShell";
import { BondBadge } from "@/components/BondBadge";
import { CopyCommand } from "@/components/CopyCommand";
import { DashboardFrame } from "@/components/DashboardFrame";
import { DashPanel } from "@/components/DashPanel";
import { DeadlineClock } from "@/components/DeadlineClock";
import { PreviewList } from "@/components/PreviewList";
import { QuoteList } from "@/components/QuoteList";
import { SolverHealthBar } from "@/components/SolverHealthBar";
import { useSolverConsole } from "@/hooks/useSolverConsole";
import { mempoolUrl, yoctoToNear } from "@/lib/contract";
import {
  deriveCommand,
  derivationPathFor,
  dryRunCommand,
  quoteCommand,
  settleCommand,
  settlementSteps,
  urgency,
  watchCommand,
} from "@/lib/solver-ops";

export default function SolverConsolePage() {
  const {
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
    loading,
    refreshing,
    polling,
    paused,
    error,
    contractId,
    network,
    fetchedAt,
    nextPollInMs,
    urgentSettling,
    refresh,
  } = useSolverConsole();

  return (
    <AppShell>
      <DashboardFrame
        eyebrow="Feature · Solve"
        title="Solver console"
        description="Live order book from the deployed NEAR contract. Workers quote, derive, fund, and settle with Chain Signatures."
        toolbar={
          <>
            <SolverHealthBar
              network={network || "testnet"}
              contractId={contractId}
              openCount={openBook.length}
              settlingCount={settling.length}
              terminalCount={terminal.length}
              lastRefreshAt={fetchedAt}
              nextPollInMs={nextPollInMs}
              polling={polling}
              paused={paused}
              error={error}
              onRefresh={() => void refresh()}
              refreshing={refreshing}
            />
            {urgentSettling.length > 0 ? (
              <p className="border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-gold">
                {urgentSettling.length} settlement
                {urgentSettling.length === 1 ? "" : "s"} near or past deadline.
              </p>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by intent, recipient, creator, winner…"
                className="w-full border border-white/10 bg-navy-mid/80 px-4 py-3 text-sm outline-none focus:border-gold/50"
              />
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["all", "All"],
                    ["open", "Open"],
                    ["settling", "Settling"],
                    ["terminal", "Terminal"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={`border px-3 py-2 text-xs transition-colors ${
                      filter === value
                        ? "border-gold/50 bg-gold/10 text-gold"
                        : "border-white/10 text-mist/60 hover:border-gold/30 hover:text-gold"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        }
      >
        {loading ? (
          <div className="border border-white/10 px-5 py-10 text-sm text-mist/45">
            Fetching live intents from NEAR…
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            <DashPanel title="Live order book">
              <PreviewList
                items={visible}
                pinnedKey={selectedId}
                modalTitle="All matching intents"
                empty={
                  <div className="px-5 py-10 text-sm text-mist/45">
                    No live intents match this filter. Post one from Create, or
                    clear filters.
                  </div>
                }
                getKey={(intent) => intent.intent_id}
                renderItem={(intent, _index, { closeModal }) => {
                  const selectedRow = intent.intent_id === selectedId;
                  const u = urgency(intent);
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(intent.intent_id);
                        closeModal();
                      }}
                      className={`flex w-full items-start justify-between gap-3 px-4 py-4 text-left transition-colors ${
                        selectedRow ? "bg-gold/10" : "hover:bg-white/[0.03]"
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
                            urgency={u !== "ok"}
                          />
                        </div>
                        {u !== "ok" ? (
                          <p
                            className={`mt-1 text-[11px] ${
                              u === "late" ? "text-red-300" : "text-gold"
                            }`}
                          >
                            {u === "late"
                              ? "Past deadline — slash risk"
                              : "Deadline soon"}
                          </p>
                        ) : null}
                      </div>
                      <BondBadge state={intent.bond_state} />
                    </button>
                  );
                }}
              />
            </DashPanel>

            <div className="space-y-4">
              {!selected ? (
                <DashPanel title="Selected">
                  <p className="px-4 py-8 text-sm text-mist/45">
                    Select a live intent to see worker commands and settlement
                    checklist.
                  </p>
                </DashPanel>
              ) : (
                <>
                  <DashPanel title="Selected">
                    <div className="space-y-4 px-4 py-4">
                      <div>
                        <p className="font-mono text-xs text-mist/60">
                          {selected.intent_id}
                        </p>
                        <p className="mt-1 font-display text-2xl text-mist">
                          {selected.status}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <BondBadge state={selected.bond_state} />
                          <DeadlineClock
                            deadlineMs={selected.deadline_ms}
                            urgency={urgency(selected) !== "ok"}
                          />
                        </div>
                      </div>
                      <dl className="grid gap-3 text-xs text-mist/55">
                        <div>
                          <dt className="uppercase tracking-[0.14em]">
                            Creator
                          </dt>
                          <dd className="mt-1 break-all font-mono text-mist/85">
                            {selected.creator}
                          </dd>
                        </div>
                        <div>
                          <dt className="uppercase tracking-[0.14em]">
                            Recipient
                          </dt>
                          <dd className="mt-1 break-all font-mono text-mist/85">
                            {selected.recipient_address}
                          </dd>
                        </div>
                        <div>
                          <dt className="uppercase tracking-[0.14em]">
                            Locked bond
                          </dt>
                          <dd className="mt-1 text-gold">
                            {yoctoToNear(selected.locked_bond)} NEAR
                          </dd>
                        </div>
                        <div>
                          <dt className="uppercase tracking-[0.14em]">
                            Chain Signatures path
                          </dt>
                          <dd className="mt-1 break-all font-mono text-gold/90">
                            {derivationPathFor(selected)}
                          </dd>
                        </div>
                        {selected.btc_tx_hash ? (
                          <div>
                            <dt className="uppercase tracking-[0.14em]">
                              Bitcoin proof
                            </dt>
                            <dd className="mt-1">
                              <a
                                className="text-gold hover:text-gold-soft"
                                href={mempoolUrl(selected.btc_tx_hash)}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {selected.btc_tx_hash.slice(0, 20)}…
                              </a>
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                    </div>
                  </DashPanel>

                  <DashPanel title="Pipeline">
                    <ol className="space-y-2 px-4 py-4">
                      {settlementSteps(selected).map((step, index) => (
                        <li
                          key={step.id}
                          className={`flex items-start gap-3 text-sm ${
                            step.active
                              ? "text-gold"
                              : step.done
                                ? "text-mist/70"
                                : "text-mist/35"
                          }`}
                        >
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border border-current text-[10px]">
                            {step.done ? "✓" : index + 1}
                          </span>
                          <span>{step.label}</span>
                        </li>
                      ))}
                    </ol>
                  </DashPanel>

                  <DashPanel title="Live quotes">
                    <div className="px-4 py-4">
                      <QuoteList quotes={selected.quotes} />
                    </div>
                  </DashPanel>

                  <DashPanel title="Worker commands">
                    <div className="space-y-3 px-4 py-4">
                      {(selected.status === "Open" ||
                        selected.status === "Quoted") && (
                        <CopyCommand
                          label="Quote + lock bond"
                          command={quoteCommand(selected.intent_id)}
                        />
                      )}
                      {(selected.status === "Selected" ||
                        selected.status === "Settling") && (
                        <>
                          <CopyCommand
                            label="Derive BTC address"
                            command={deriveCommand(selected.intent_id)}
                          />
                          <CopyCommand
                            label="Settle via Chain Signatures"
                            command={settleCommand(selected.intent_id)}
                          />
                        </>
                      )}
                      <CopyCommand
                        label="Watch open book"
                        command={watchCommand()}
                      />
                      <CopyCommand
                        label="Auto-quote watcher"
                        command={watchCommand(true)}
                      />
                      <CopyCommand
                        label="Offline dry-run"
                        command={dryRunCommand()}
                      />
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
