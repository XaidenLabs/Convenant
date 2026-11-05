"use client";

import { useMemo, useState } from "react";
import { validateIntentForm } from "@/lib/bitcoin";

export type IntentFormValues = {
  recipient: string;
  amountMin: string;
  deadlineMinutes: string;
};

const PRESETS = [
  {
    label: "10k sats · 30m",
    recipient: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
    amountMin: "10000",
    deadlineMinutes: "30",
  },
  {
    label: "25k sats · 15m",
    recipient: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
    amountMin: "25000",
    deadlineMinutes: "15",
  },
];

export function IntentForm({
  onSubmit,
  busy,
}: {
  onSubmit: (values: IntentFormValues) => Promise<void>;
  busy?: boolean;
}) {
  const [recipient, setRecipient] = useState(PRESETS[0].recipient);
  const [amountMin, setAmountMin] = useState(PRESETS[0].amountMin);
  const [deadlineMinutes, setDeadlineMinutes] = useState(
    PRESETS[0].deadlineMinutes
  );
  const [touched, setTouched] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validationError = useMemo(
    () => validateIntentForm({ recipient, amountMin, deadlineMinutes }),
    [recipient, amountMin, deadlineMinutes]
  );

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setTouched(true);
        const error = validateIntentForm({
          recipient,
          amountMin,
          deadlineMinutes,
        });
        if (error) {
          setSubmitError(error);
          return;
        }
        setSubmitError(null);
        await onSubmit({
          recipient: recipient.trim(),
          amountMin,
          deadlineMinutes,
        });
      }}
    >
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            disabled={busy}
            onClick={() => {
              setRecipient(preset.recipient);
              setAmountMin(preset.amountMin);
              setDeadlineMinutes(preset.deadlineMinutes);
              setSubmitError(null);
            }}
            className="border border-white/10 px-3 py-1.5 text-xs text-mist/70 transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <label className="block space-y-2">
        <span className="text-xs uppercase tracking-[0.16em] text-mist/50">
          Bitcoin testnet recipient
        </span>
        <input
          className="w-full border border-white/10 bg-navy-mid/80 px-4 py-3 text-mist outline-none transition-colors focus:border-gold/50"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="tb1q…"
          autoComplete="off"
          spellCheck={false}
          required
        />
        <span className="block text-xs text-mist/40">
          Recipient never needs a NEAR wallet or Covenant login.
        </span>
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-mist/50">
            Min BTC sats
          </span>
          <input
            type="number"
            min="1"
            className="w-full border border-white/10 bg-navy-mid/80 px-4 py-3 text-mist outline-none transition-colors focus:border-gold/50"
            value={amountMin}
            onChange={(e) => setAmountMin(e.target.value)}
            onBlur={() => setTouched(true)}
            required
          />
        </label>
        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-mist/50">
            Deadline (minutes)
          </span>
          <input
            type="number"
            min="1"
            max="1440"
            className="w-full border border-white/10 bg-navy-mid/80 px-4 py-3 text-mist outline-none transition-colors focus:border-gold/50"
            value={deadlineMinutes}
            onChange={(e) => setDeadlineMinutes(e.target.value)}
            onBlur={() => setTouched(true)}
            required
          />
        </label>
      </div>

      {(touched && validationError) || submitError ? (
        <p className="text-sm text-red-300" role="alert">
          {submitError || validationError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy || Boolean(validationError)}
        className="w-full bg-gold px-8 py-3 font-semibold tracking-wide text-navy-deep transition-colors hover:bg-gold-soft disabled:opacity-50 sm:w-auto"
      >
        {busy ? "Posting…" : "Post intent"}
      </button>
    </form>
  );
}
