"use client";

import { CONTRACT_ID, NETWORK } from "@/lib/contract";

export function ProtocolBar({
  localMode,
  intentCount,
}: {
  localMode: boolean;
  intentCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border border-white/10 bg-navy/40 px-4 py-3 text-xs text-mist/55">
      <span>
        Network{" "}
        <strong className="font-medium text-mist/85">{NETWORK}</strong>
      </span>
      <span className="hidden h-3 w-px bg-white/10 sm:block" />
      <span className="max-w-full truncate">
        Contract{" "}
        <a
          className="font-mono text-gold/90 hover:text-gold"
          href={`https://testnet.nearblocks.io/address/${CONTRACT_ID}`}
          target="_blank"
          rel="noreferrer"
        >
          {CONTRACT_ID}
        </a>
      </span>
      <span className="hidden h-3 w-px bg-white/10 sm:block" />
      <span>
        Mode{" "}
        <strong className="font-medium text-mist/85">
          {localMode ? "local stub" : "live views"}
        </strong>
      </span>
      <span className="hidden h-3 w-px bg-white/10 sm:block" />
      <span>
        Intents tracked{" "}
        <strong className="font-medium text-mist/85">{intentCount}</strong>
      </span>
    </div>
  );
}
