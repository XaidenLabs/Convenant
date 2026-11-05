export type IntentStatus =
  | "Open"
  | "Quoted"
  | "Selected"
  | "Settling"
  | "Completed"
  | "Failed"
  | "Expired";

export type BondState = "None" | "Locked" | "Released" | "Slashed";

export type IndexedIntent = {
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
  treasury_slashed: string;
  derivation_path: string;
  updated_at_ms: number;
  source: "chain" | "seed" | "demo";
};

export type IndexedQuote = {
  intent_id: string;
  solver: string;
  quoted_amount: string;
  bond_amount: string;
  submitted_at_ms: number;
  active: boolean;
};

export type StoreSnapshot = {
  intents: IndexedIntent[];
  quotes: IndexedQuote[];
  synced_at_ms: number;
};
