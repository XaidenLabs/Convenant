"use client";

import { useState } from "react";
import { BondBadge } from "./BondBadge";
import { DeadlineClock } from "./DeadlineClock";
import {
  BondStateView,
  IntentView,
  mempoolUrl,
  yoctoToNear,
} from "@/lib/contract";

export function SettlementPanel({
  intent,
  bond,
  derivationPath,
  onSelectWinner,
  onSimulateFailure,
  onSettleDemo,
  busy,
}: {
  intent: IntentView;
  bond: BondStateView;
  derivationPath?: string;
  onSelectWinner: () => void;
  onSimulateFailure: () => void;
  onSettleDemo: () => void;
  busy?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const canSelect = intent.status === "Quoted" || intent.status === "Open";
  const canSettle =
    intent.status === "Selected" || intent.status === "Settling";
  const canSlash = bond.state === "Locked";

  async function copyPath() {
    if (!derivationPath) return;
    try {
      await navigator.clipboard.writeText(derivationPath);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-mist/45">
            Intent {intent.intent_id}
          </p>
          <p className="mt-1 font-display text-2xl text-mist">{intent.status}</p>
          <div className="mt-2">
            <DeadlineClock deadlineMs={intent.deadline_ms} />
          </div>
        </div>
        <BondBadge state={bond.state} />
      </div>

      <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-[0.14em] text-mist/45">
            Recipient (never touches NEAR)
          </dt>
          <dd className="mt-1 break-all font-mono text-mist/90">
            {intent.recipient_address}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.14em] text-mist/45">
            Locked bond
          </dt>
          <dd className="mt-1 font-display text-xl text-gold">
            {yoctoToNear(bond.locked_amount)} NEAR
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.14em] text-mist/45">
            Winner
          </dt>
          <dd className="mt-1">{bond.solver || intent.winner || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.14em] text-mist/45">
            Slashed to treasury
          </dt>
          <dd className="mt-1">{yoctoToNear(bond.treasury_slashed)} NEAR</dd>
        </div>
        {derivationPath ? (
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-[0.14em] text-mist/45">
              Chain Signatures path
            </dt>
            <dd className="mt-1 flex flex-wrap items-center gap-3">
              <span className="break-all font-mono text-gold/90">
                {derivationPath}
              </span>
              <button
                type="button"
                onClick={() => void copyPath()}
                className="border border-white/15 px-2 py-1 text-[11px] text-mist/70 hover:border-gold/40 hover:text-gold"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </dd>
          </div>
        ) : null}
      </dl>

      {intent.btc_tx_hash ? (
        <div className="space-y-1">
          <a
            href={mempoolUrl(intent.btc_tx_hash)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-gold underline underline-offset-4 hover:text-gold-soft"
          >
            Bitcoin tx: {intent.btc_tx_hash.slice(0, 18)}…
          </a>
          <p className="text-xs text-mist/40">
            Offline demos may show a placeholder hash until live Chain Signatures
            settlement.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        {canSelect ? (
          <button
            type="button"
            disabled={busy || intent.quote_count === 0}
            onClick={onSelectWinner}
            className="border border-gold/50 px-5 py-2.5 text-gold transition-colors hover:bg-gold/10 disabled:opacity-50"
          >
            Select winner
          </button>
        ) : null}
        {canSettle ? (
          <button
            type="button"
            disabled={busy}
            onClick={onSettleDemo}
            className="bg-gold px-5 py-2.5 font-semibold text-navy-deep transition-colors hover:bg-gold-soft disabled:opacity-50"
          >
            Trigger settlement
          </button>
        ) : null}
        {canSlash ? (
          <button
            type="button"
            disabled={busy}
            onClick={onSimulateFailure}
            className="border border-red-400/50 px-5 py-2.5 text-red-300 transition-colors hover:bg-red-400/10 disabled:opacity-50"
          >
            Simulate Failure
          </button>
        ) : null}
      </div>
    </div>
  );
}
