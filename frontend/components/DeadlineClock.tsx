"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms: number, urgency: boolean) {
  if (ms <= 0) {
    return urgency ? "Deadline passed" : "Deadline elapsed";
  }
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}h ${rm}m remaining`;
  }
  return `${m}m ${String(s).padStart(2, "0")}s remaining`;
}

export function DeadlineClock({
  deadlineMs,
  urgency = true,
}: {
  deadlineMs: number;
  /** When false (completed / slashed archives), overdue is muted — not an active risk. */
  urgency?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = deadlineMs - now;
  const overdue = remaining <= 0;

  return (
    <p
      className={`font-mono text-xs ${
        overdue
          ? urgency
            ? "text-red-300"
            : "text-mist/45"
          : remaining < 5 * 60_000 && urgency
            ? "text-gold"
            : "text-mist/50"
      }`}
    >
      {formatRemaining(remaining, urgency)}
    </p>
  );
}
