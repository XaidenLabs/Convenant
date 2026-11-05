"use client";

import { IntentForm } from "@/components/IntentForm";
import { QuoteList } from "@/components/QuoteList";
import { SettlementPanel } from "@/components/SettlementPanel";
import { DemoGuide } from "@/components/DemoGuide";
import { AppShell } from "@/components/AppShell";
import { DashboardFrame } from "@/components/DashboardFrame";
import { DashPanel } from "@/components/DashPanel";
import { ProtocolBar } from "@/components/ProtocolBar";
import { IntentShelf } from "@/components/IntentShelf";
import { SettlementTimeline } from "@/components/SettlementTimeline";
import { ActivityFeed } from "@/components/ActivityFeed";
import { NextActionCard } from "@/components/NextActionCard";
import { ModeBanner } from "@/components/ModeBanner";
import { CONTRACT_ID } from "@/lib/contract";
import { useCreateConsole } from "@/hooks/useCreateConsole";

export default function CreateConsolePage() {
  const {
    wallet,
    busy,
    booting,
    status,
    active,
    history,
    activity,
    localMode,
    nextAction,
    ensureWallet,
    handlePost,
    handleQuoteDemo,
    handleSelectWinner,
    handleSettleDemo,
    handleSimulateFailure,
    runHappyPath,
    runSlashPath,
    startNewIntent,
    selectFromShelf,
  } = useCreateConsole();

  return (
    <AppShell
      right={
        <button
          type="button"
          onClick={() => void ensureWallet()}
          className="border border-white/15 px-4 py-2 text-sm text-mist/80 transition-colors hover:border-gold/40 hover:text-gold"
          aria-label={
            wallet ? `Connected as ${wallet.accountId}` : "Connect NEAR wallet"
          }
        >
          {wallet ? wallet.accountId : "Connect NEAR wallet"}
        </button>
      }
    >
      <DashboardFrame
        eyebrow="Feature · Create"
        title="Create console"
        description="Post remittance intents, rank bonded quotes, lock a winner, then settle BTC or slash. Wallet signatures only — recipients never log in."
        actions={
          <button
            type="button"
            onClick={startNewIntent}
            disabled={busy}
            className="border border-white/15 px-4 py-2 text-sm text-mist/75 transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
          >
            New intent
          </button>
        }
        toolbar={
          <>
            <ProtocolBar
              localMode={localMode}
              intentCount={Math.max(history.length, active ? 1 : 0)}
            />
            <ModeBanner localMode={localMode} />
          </>
        }
      >
        {booting ? (
          <div className="border border-white/10 px-5 py-10 text-sm text-mist/45">
            Loading create console…
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_240px] lg:items-start">
            <DashPanel title="Intent shelf">
              <IntentShelf
                items={history}
                activeId={active?.intent_id}
                onSelect={selectFromShelf}
              />
            </DashPanel>

            <div className="space-y-4">
              <NextActionCard action={nextAction} />

              <DashPanel title="Demo walkthrough">
                <DemoGuide
                  intent={active}
                  localMode={localMode}
                  busy={busy}
                  onRunHappyPath={runHappyPath}
                  onRunSlashPath={runSlashPath}
                />
              </DashPanel>

              <DashPanel title="Post remittance intent">
                <div className="space-y-4 px-4 py-4">
                  <p className="text-sm text-mist/50">
                    Bitcoin testnet destination. Amount is minimum sats.
                    Deadline opens the slash window.
                  </p>
                  <IntentForm onSubmit={handlePost} busy={busy} />
                </div>
              </DashPanel>

              <DashPanel
                title="Settlement workspace"
                action={
                  active ? (
                    <button
                      type="button"
                      disabled={
                        busy ||
                        (active.status !== "Open" &&
                          active.status !== "Quoted")
                      }
                      onClick={() => void handleQuoteDemo()}
                      className="text-xs text-gold transition-colors hover:text-gold-soft disabled:opacity-40"
                    >
                      + Demo quote
                    </button>
                  ) : null
                }
              >
                <div className="space-y-6 px-4 py-4">
                  {active ? (
                    <>
                      <SettlementTimeline
                        status={active.status}
                        bond={active.bond.state}
                      />
                      <div>
                        <h3 className="mb-3 font-display text-2xl text-mist">
                          Quotes
                        </h3>
                        <QuoteList quotes={active.quotes} />
                      </div>
                      <div className="border-t border-white/10 pt-5">
                        <SettlementPanel
                          intent={active}
                          bond={active.bond}
                          derivationPath={active.derivation_path}
                          busy={busy}
                          onSelectWinner={() => void handleSelectWinner()}
                          onSimulateFailure={() => void handleSimulateFailure()}
                          onSettleDemo={() => void handleSettleDemo()}
                        />
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-mist/45">
                      No active intent. Post one, pick from the shelf, or run a
                      walkthrough.
                    </p>
                  )}
                </div>
              </DashPanel>
            </div>

            <div className="space-y-4">
              <DashPanel title="Activity">
                <ActivityFeed items={activity} />
              </DashPanel>
              <DashPanel title="Auth model">
                <div className="space-y-2 px-4 py-4 text-xs leading-relaxed text-mist/50">
                  <p>
                    No email login. Creators sign with a NEAR wallet. BTC
                    recipients need nothing.
                  </p>
                  <p className="break-all font-mono text-mist/65">
                    {CONTRACT_ID}
                  </p>
                </div>
              </DashPanel>
            </div>
          </div>
        )}
      </DashboardFrame>

      {status ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 border border-gold/30 bg-navy-mid px-4 py-3 text-sm text-mist"
        >
          {status}
        </div>
      ) : null}
    </AppShell>
  );
}
