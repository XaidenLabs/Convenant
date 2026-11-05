"use client";

import { useState } from "react";

export function CopyCommand({
  label,
  command,
}: {
  label?: string;
  command: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-2">
      {label ? (
        <p className="text-[10px] uppercase tracking-[0.16em] text-mist/40">
          {label}
        </p>
      ) : null}
      <div className="flex items-start gap-2 bg-navy-deep/90 p-3">
        <pre className="flex-1 overflow-x-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-5 text-gold/85">
          {command}
        </pre>
        <button
          type="button"
          onClick={() => void copy()}
          className="shrink-0 border border-white/15 px-2 py-1 text-[11px] text-mist/70 transition-colors hover:border-gold/40 hover:text-gold"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
