/** Shared Covenant domain — used by frontend, indexer, and solver. */

export type IntentStatus =
  | "Open"
  | "Quoted"
  | "Selected"
  | "Settling"
  | "Completed"
  | "Failed"
  | "Expired";

export type BondState = "None" | "Locked" | "Released" | "Slashed";

export type IntentRecord = {
  intent_id: string;
  creator: string;
  destination_chain: string;
  recipient_address: string;
  amount_min: string;
  deadline_ms: number;
  status: IntentStatus;
  created_at_ms: number;
  winner: string | null;
  btc_tx_hash: string | null;
  bond_state: BondState;
  locked_bond: string;
  quote_count: number;
  treasury_slashed?: string;
  derivation_path?: string;
  updated_at_ms?: number;
};

export type QuoteRecord = {
  solver: string;
  quoted_amount: string;
  bond_amount: string;
  submitted_at_ms: number;
  active: boolean;
};

export type ProtocolStats = {
  network: string;
  contract_id: string;
  intent_count: number;
  open_count: number;
  completed_count: number;
  slashed_count: number;
  locked_bond_yocto: string;
  indexed_at_ms: number;
};

/** Lifecycle order for UI timelines (Failed/Slashed handled separately). */
export const SETTLEMENT_STAGES: IntentStatus[] = [
  "Open",
  "Quoted",
  "Selected",
  "Settling",
  "Completed",
];

export function derivationPath(intentId: string): string {
  return `covenant-${intentId}`;
}

export function canAcceptQuotes(status: IntentStatus): boolean {
  return status === "Open" || status === "Quoted";
}

export function canSelectWinner(status: IntentStatus, quoteCount: number): boolean {
  return (status === "Open" || status === "Quoted") && quoteCount > 0;
}

export function canSettle(status: IntentStatus, bond: BondState): boolean {
  return (
    (status === "Selected" || status === "Settling") && bond === "Locked"
  );
}

export function canSlash(bond: BondState): boolean {
  return bond === "Locked";
}

export function isTerminal(status: IntentStatus): boolean {
  return status === "Completed" || status === "Failed" || status === "Expired";
}

export function stageIndex(status: IntentStatus, bond: BondState): number {
  if (status === "Failed" || bond === "Slashed") return -1;
  if (status === "Open") return 0;
  if (status === "Quoted") return 1;
  if (status === "Selected" || status === "Settling") return 2;
  if (status === "Completed" || bond === "Released") return 4;
  return 0;
}

export const MIN_BOND_YOCTO = "100000000000000000000000"; // 0.1 NEAR
export const SUCCESS_FEE_BPS = 100;
