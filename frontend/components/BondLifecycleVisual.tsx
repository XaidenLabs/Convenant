"use client";

import { useEffect, useState } from "react";

const BEATS = [
  {
    id: "locked",
    label: "Bond locked",
    status: "Settling",
    detail: "Solver collateral held on NEAR",
    tone: "gold" as const,
  },
  {
    id: "btc",
    label: "BTC signed",
    status: "Chain Signatures",
    detail: "Native Bitcoin to the recipient address",
    tone: "mist" as const,
  },
  {
    id: "released",
    label: "Bond released",
    status: "Completed",
    detail: "Proof accepted — solver paid for delivery",
    tone: "emerald" as const,
  },
  {
    id: "slashed",
    label: "Bond slashed",
    status: "Failed",
    detail: "Miss the window — collateral taken on-chain",
    tone: "red" as const,
  },
];

/**
 * Full-bleed product visual for the hero — cycles the enforcement story.
 * Not a card collage: one edge-to-edge plane.
 */
export function BondLifecycleVisual() {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % BEATS.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const beat = BEATS[index];

  return (
    <div
      className="relative w-full overflow-hidden border-y border-white/10 bg-navy/60"
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_20%_50%,rgba(201,162,39,0.12),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,transparent_40%,rgba(232,230,225,0.03)_50%,transparent_60%)] animate-sweep" />

      <div className="relative mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-14">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist/40">
            Live enforcement loop
          </p>
          <p
            key={beat.id + "-status"}
            className="mt-3 animate-beat-in font-display text-4xl tracking-tight text-mist sm:text-5xl"
          >
            {beat.status}
          </p>
          <p
            key={beat.id + "-detail"}
            className="mt-3 max-w-md animate-beat-in text-sm leading-relaxed text-mist/55"
          >
            {beat.detail}
          </p>

          <ol className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
            {BEATS.map((b, i) => (
              <li
                key={b.id}
                className={`font-mono text-[11px] tracking-[0.14em] uppercase transition-colors duration-500 ${
                  i === index ? "text-gold" : "text-mist/30"
                }`}
              >
                {String(i + 1).padStart(2, "0")} {b.label}
              </li>
            ))}
          </ol>
        </div>

        <div className="relative flex flex-col justify-center border-l border-white/10 pl-0 md:pl-10">
          <div className="flex items-center gap-3">
            <span
              key={beat.id + "-dot"}
              className={`h-2.5 w-2.5 rounded-full transition-colors duration-500 ${
                beat.tone === "gold"
                  ? reduceMotion
                    ? "bg-gold"
                    : "bg-gold animate-pulse"
                  : beat.tone === "emerald"
                    ? "bg-emerald-400"
                    : beat.tone === "red"
                      ? "bg-red-400"
                      : "bg-mist/70"
              }`}
            />
            <p
              key={beat.id + "-label"}
              className={`animate-beat-in text-xs uppercase tracking-[0.18em] ${
                beat.tone === "gold"
                  ? "text-gold"
                  : beat.tone === "emerald"
                    ? "text-emerald-300"
                    : beat.tone === "red"
                      ? "text-red-300"
                      : "text-mist/70"
              }`}
            >
              Bond · {beat.label}
            </p>
          </div>

          <div className="mt-6 space-y-3 font-mono text-xs text-mist/45">
            <p>
              path{" "}
              <span className="text-gold/80">covenant-covenant-1</span>
            </p>
            <p>
              recipient{" "}
              <span className="text-mist/70">
                tb1q… never needs a NEAR wallet
              </span>
            </p>
            <p>
              proof{" "}
              <span className="text-mist/70">mempool.space / testnet</span>
            </p>
          </div>

          <div className="mt-8 h-px w-full overflow-hidden bg-white/10">
            <div
              key={beat.id + "-bar"}
              className="h-full w-full origin-left animate-progress bg-gold/70"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
