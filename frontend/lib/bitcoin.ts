/** Lightweight Bitcoin testnet address checks for the create form. */

export function isLikelyBtcTestnetAddress(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  // Bech32 testnet (tb1…) — most common for demos
  if (/^tb1[a-z0-9]{8,90}$/i.test(v)) return true;
  // Legacy testnet (m/n/2…)
  if (/^[mn2][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(v)) return true;
  return false;
}

export function validateIntentForm(input: {
  recipient: string;
  amountMin: string;
  deadlineMinutes: string;
}): string | null {
  if (!isLikelyBtcTestnetAddress(input.recipient)) {
    return "Enter a Bitcoin testnet address (tb1… / m… / n… / 2…).";
  }
  const sats = Number(input.amountMin);
  if (!Number.isFinite(sats) || sats < 1) {
    return "Minimum sats must be at least 1.";
  }
  if (sats > 100_000_000) {
    return "Keep demo amounts under 1 BTC (100,000,000 sats).";
  }
  const mins = Number(input.deadlineMinutes);
  if (!Number.isFinite(mins) || mins < 1) {
    return "Deadline must be at least 1 minute.";
  }
  if (mins > 24 * 60) {
    return "Deadline cannot exceed 24 hours for the prototype.";
  }
  return null;
}
