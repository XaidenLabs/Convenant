import type { NextAction } from "@/lib/next-action";

const TONE: Record<NextAction["tone"], string> = {
  neutral: "border-white/10 text-mist/70",
  gold: "border-gold/35 bg-gold/5 text-gold",
  danger: "border-red-400/35 bg-red-400/5 text-red-300",
  success: "border-emerald-400/35 bg-emerald-400/5 text-emerald-300",
};

export function NextActionCard({ action }: { action: NextAction }) {
  return (
    <div className={`border px-4 py-4 ${TONE[action.tone]}`}>
      <p className="text-[10px] uppercase tracking-[0.16em] opacity-70">
        Next action
      </p>
      <p className="mt-2 font-display text-xl text-mist">{action.title}</p>
      <p className="mt-2 text-sm leading-relaxed text-mist/65">{action.detail}</p>
    </div>
  );
}
