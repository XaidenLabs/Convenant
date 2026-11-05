/**
 * Full-width product preview under the hero — shows the bonded settlement UI.
 */
export function HeroProductFrame() {
  return (
    <div
      className="relative mt-14 animate-fade-up md:mt-16 [--animation-delay:500ms]"
      aria-hidden="true"
    >
      <div className="overflow-hidden border border-gold/20 bg-navy shadow-[0_40px_120px_-40px_rgba(201,162,39,0.35)]">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <span className="h-2 w-2 rounded-full bg-white/20" />
          <span className="h-2 w-2 rounded-full bg-white/20" />
          <span className="h-2 w-2 rounded-full bg-white/20" />
          <span className="ml-3 font-mono text-[11px] text-mist/40">
            covenant · marketplace
          </span>
        </div>

        <div className="grid md:grid-cols-2">
          <div className="space-y-4 border-b border-white/10 p-6 md:border-b-0 md:border-r">
            <p className="text-[10px] uppercase tracking-[0.18em] text-gold/70">
              Post remittance intent
            </p>
            <div className="space-y-3">
              <div className="border border-white/10 bg-navy-mid/40 px-3 py-2.5">
                <p className="text-[10px] text-mist/40">Bitcoin recipient</p>
                <p className="mt-1 truncate font-mono text-xs text-mist/80">
                  tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-white/10 bg-navy-mid/40 px-3 py-2.5">
                  <p className="text-[10px] text-mist/40">Min sats</p>
                  <p className="mt-1 font-display text-lg text-mist">10,000</p>
                </div>
                <div className="border border-white/10 bg-navy-mid/40 px-3 py-2.5">
                  <p className="text-[10px] text-mist/40">Deadline</p>
                  <p className="mt-1 font-display text-lg text-mist">30m</p>
                </div>
              </div>
              <div className="bg-gold px-4 py-2.5 text-center text-sm font-semibold text-navy-deep">
                Post intent
              </div>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-mist/40">
                  Intent covenant-1
                </p>
                <p className="font-display text-2xl text-mist">Completed</p>
              </div>
              <span className="inline-flex items-center gap-2 border border-emerald-400/35 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Bond released
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-mist/40">
                  Locked bond
                </p>
                <p className="mt-1 font-display text-xl text-gold">0 NEAR</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-mist/40">
                  Chain Signatures
                </p>
                <p className="mt-1 font-mono text-xs text-gold/80">
                  covenant-covenant-1
                </p>
              </div>
            </div>
            <p className="text-sm text-gold/90 underline underline-offset-4">
              Bitcoin tx · mempool.space/testnet
            </p>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-navy-deep to-transparent" />
    </div>
  );
}
