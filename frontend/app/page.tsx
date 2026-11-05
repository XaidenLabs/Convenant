import Link from "next/link";
import { MarketingNav } from "@/components/MarketingNav";
import { BondLifecycleVisual } from "@/components/BondLifecycleVisual";
import { Reveal } from "@/components/Reveal";

const BEATS = [
  {
    number: "01",
    title: "Quote locks a bond",
    copy: "Solvers put NEAR at risk when they quote. Empty promises never enter the book.",
  },
  {
    number: "02",
    title: "Settle native BTC",
    copy: "The winner delivers Bitcoin through Chain Signatures — real BTC, no wrap, no bridge.",
  },
  {
    number: "03",
    title: "Miss it — get slashed",
    copy: "Fail the deadline and the bond slashes on-chain. The next solver can take the route.",
  },
];

const PATHS = [
  {
    href: "/app",
    title: "Create",
    copy: "Post an intent. Rank bonded quotes. Release or slash.",
  },
  {
    href: "/solver",
    title: "Solve",
    copy: "Live open book, settlement checklist, worker commands.",
  },
  {
    href: "/explore",
    title: "Explore",
    copy: "Public settlements — bonds, proofs, shareable links.",
  },
  {
    href: "/protocol",
    title: "Protocol",
    copy: "Indexer read path. On-chain write path. Wallet-only auth.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-navy-deep text-mist">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_95%_60%_at_50%_-20%,rgba(201,162,39,0.18),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_45%_50%_at_100%_10%,rgba(18,48,80,0.55),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(232,230,225,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(232,230,225,0.6)_1px,transparent_1px)] [background-size:72px_72px]"
      />

      <MarketingNav />

      <main>
        {/* Pitch slide 1 — Hero composition */}
        <section className="relative pt-20 md:pt-24">
          <div className="mx-auto max-w-6xl px-6 pb-10 md:px-8 md:pb-12">
            <p className="animate-fade-in font-display text-[clamp(3.5rem,13vw,8rem)] font-semibold leading-[0.86] tracking-[-0.045em] text-mist [--animation-delay:40ms]">
              Covenant
            </p>
            <div className="mt-3 h-px w-24 animate-fade-in overflow-hidden bg-white/10 [--animation-delay:140ms]">
              <div className="h-full w-full gold-shimmer" />
            </div>

            <h1 className="mt-7 max-w-3xl animate-fade-in font-display text-[clamp(1.7rem,3.6vw,2.75rem)] font-medium leading-[1.12] tracking-tight text-mist/95 [--animation-delay:180ms]">
              The promise is enforced by the chain.
            </h1>

            <p className="mt-5 max-w-xl animate-fade-in text-base leading-relaxed text-mist/65 md:text-lg [--animation-delay:280ms]">
              Bonded solver marketplace for NEAR Intents. Quotes lock
              collateral. Chain Signatures deliver Bitcoin. Failed settlement
              slashes automatically.
            </p>

            <div className="mt-9 flex animate-fade-in flex-wrap items-center gap-3 [--animation-delay:380ms]">
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center bg-gold px-6 text-sm font-semibold text-navy-deep transition-colors hover:bg-gold-soft"
              >
                Dashboard
              </Link>
              <a
                href="#demo"
                className="inline-flex h-11 items-center border border-white/15 px-5 text-sm font-medium text-mist/80 transition-colors hover:border-gold/40 hover:text-gold"
              >
                See the demo paths
              </a>
            </div>
          </div>

          <div className="animate-fade-up [--animation-delay:480ms]">
            <BondLifecycleVisual />
          </div>
        </section>

        {/* Pitch slide 2 — Problem */}
        <section
          id="problem"
          className="relative mx-auto max-w-6xl border-t border-white/10 px-6 py-20 md:px-8 md:py-24"
        >
          <Reveal>
            <p className="text-xs uppercase tracking-[0.18em] text-gold/80">
              The problem
            </p>
            <h2 className="mt-4 max-w-3xl font-display text-3xl tracking-tight text-mist sm:text-5xl">
              Remittance quotes are cheap talk until someone locks a bond.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-mist/60 md:text-lg">
              Solver markets promise rates. Without collateral and destination
              delivery, the quote is theater. Recipients should not need a NEAR
              wallet to get paid — and creators should not chase failed
              settlement in a support inbox.
            </p>
          </Reveal>
        </section>

        {/* Pitch slide 3 — Mechanism */}
        <section
          id="how"
          className="relative border-t border-white/10 bg-navy/30"
        >
          <div className="mx-auto max-w-6xl px-6 py-20 md:px-8 md:py-24">
            <Reveal>
              <p className="text-xs uppercase tracking-[0.18em] text-gold/80">
                The mechanism
              </p>
              <h2 className="mt-4 max-w-2xl font-display text-3xl tracking-tight text-mist sm:text-4xl">
                Three steps. One bond.
              </h2>
              <p className="mt-4 max-w-xl text-mist/60">
                Enforcement lives in the contract — not in a promise after the
                quote goes stale.
              </p>
            </Reveal>

            <ol className="mt-14 grid gap-12 md:grid-cols-3 md:gap-10">
              {BEATS.map((step, i) => (
                <Reveal
                  key={step.number}
                  as="li"
                  delayMs={i * 90}
                  className="border-t border-white/10 pt-6"
                >
                  <p className="font-mono text-xs tracking-[0.18em] text-gold/80">
                    {step.number}
                  </p>
                  <h3 className="mt-3 font-display text-2xl tracking-tight text-mist">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-mist/55">
                    {step.copy}
                  </p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* Pitch slide 4 — Differentiator */}
        <section
          id="why"
          className="relative mx-auto max-w-6xl px-6 py-20 md:px-8 md:py-24"
        >
          <Reveal>
            <p className="text-xs uppercase tracking-[0.18em] text-gold/80">
              Why it wins
            </p>
            <h2 className="mt-4 max-w-3xl font-display text-3xl tracking-tight text-mist sm:text-5xl">
              Real Bitcoin arrives. The bond keeps solvers honest.
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-10 border-t border-white/10 pt-10 md:grid-cols-3">
            {[
              {
                title: "Recipient needs no NEAR",
                copy: "Funds land on a Bitcoin address. No onboarding the receiver onto another chain.",
              },
              {
                title: "Chain Signatures, not a bridge",
                copy: "MPC signs a native BTC transaction. No wrapped asset. No bridge custody story.",
              },
              {
                title: "Slash is automatic",
                copy: "Miss the window and collateral moves on-chain. Judges can watch Locked → Released or Slashed.",
              },
            ].map((item, i) => (
              <Reveal key={item.title} delayMs={i * 80}>
                <div>
                  <h3 className="font-display text-xl text-mist">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-mist/55">
                    {item.copy}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Pitch slide 5 — Judge path */}
        <section
          id="demo"
          className="relative border-t border-white/10 bg-navy/30"
        >
          <div className="mx-auto max-w-6xl px-6 py-20 md:px-8 md:py-24">
            <Reveal>
              <p className="text-xs uppercase tracking-[0.18em] text-gold/80">
                What to click
              </p>
              <h2 className="mt-4 max-w-2xl font-display text-3xl tracking-tight text-mist sm:text-4xl">
                Two paths. Both load-bearing.
              </h2>
              <p className="mt-4 max-w-xl text-mist/60">
                Happy path ends in Bond Released + a Bitcoin tx link. Slash path
                ends in Bond Slashed — no human arbitration.
              </p>
            </Reveal>

            <div className="mt-12 grid gap-8 md:grid-cols-2">
              <Reveal>
                <div className="border-t border-gold/35 pt-6">
                  <p className="font-mono text-xs tracking-[0.16em] text-gold">
                    Happy path
                  </p>
                  <p className="mt-3 font-display text-2xl text-mist">
                    Intent → quote → settle → release
                  </p>
                  <p className="mt-3 text-sm text-mist/55">
                    Open Create, run the happy path, then verify the proof on
                    Explore.
                  </p>
                  <Link
                    href="/app"
                    className="mt-6 inline-flex text-sm font-medium text-gold transition-colors hover:text-gold-soft"
                  >
                    Open create console →
                  </Link>
                </div>
              </Reveal>
              <Reveal delayMs={100}>
                <div className="border-t border-white/15 pt-6">
                  <p className="font-mono text-xs tracking-[0.16em] text-mist/45">
                    Slash path
                  </p>
                  <p className="mt-3 font-display text-2xl text-mist">
                    Intent → quote → Simulate Failure
                  </p>
                  <p className="mt-3 text-sm text-mist/55">
                    Watch the bond slash on-chain. That is the product —
                    enforcement without a ticket queue.
                  </p>
                  <Link
                    href="/app"
                    className="mt-6 inline-flex text-sm font-medium text-gold transition-colors hover:text-gold-soft"
                  >
                    Run Simulate Failure →
                  </Link>
                </div>
              </Reveal>
            </div>

            <ul className="mt-16 grid gap-8 border-t border-white/10 pt-12 sm:grid-cols-2 lg:grid-cols-4">
              {PATHS.map((path, i) => (
                <Reveal key={path.href} as="li" delayMs={i * 60}>
                  <Link
                    href={path.href}
                    className="group block border-t border-white/10 pt-5 transition-colors"
                  >
                    <p className="font-display text-xl text-mist group-hover:text-gold">
                      {path.title}
                    </p>
                    <p className="mt-2 text-sm text-mist/50">{path.copy}</p>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* Pitch slide 6 — Close */}
        <section className="relative mx-auto max-w-6xl px-6 py-20 md:px-8 md:py-28">
          <Reveal>
            <h2 className="max-w-3xl font-display text-3xl tracking-tight text-mist sm:text-5xl">
              Stop trusting the quote. Enforce it.
            </h2>
            <p className="mt-5 max-w-xl text-base text-mist/60 md:text-lg">
              Covenant turns solver markets into bonded settlement — for the
              Real-World Money track on NEAR.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center bg-gold px-6 text-sm font-semibold text-navy-deep transition-colors hover:bg-gold-soft"
              >
                Dashboard
              </Link>
              <Link
                href="/protocol"
                className="inline-flex h-11 items-center border border-white/15 px-5 text-sm font-medium text-mist/80 transition-colors hover:border-gold/40 hover:text-gold"
              >
                Protocol
              </Link>
            </div>
            <p className="mt-8 font-mono text-xs text-mist/35">
              NEAR testnet · covenant-solver-mw2mng1b.testnet
            </p>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-white/10 px-6 py-8 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-lg text-mist/75">Covenant</p>
          <p className="text-xs text-mist/40">
            Real-World Money · NEAR Hackathon
          </p>
          <div className="flex gap-5 text-sm">
            <Link
              href="/explore"
              className="text-mist/55 transition-colors hover:text-gold"
            >
              Explore
            </Link>
            <Link
              href="/app"
              className="text-gold transition-colors hover:text-gold-soft"
            >
              App
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
