//! Covenant — bonded solver marketplace for NEAR Intents.
//!
//! Solvers lock a NEAR bond when quoting. On successful settlement proof the
//! bond is released; on timeout / failure the bond is slashed and the intent
//! can hand over to the next solver.

use near_sdk::borsh::{BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, UnorderedMap, Vector};
use near_sdk::json_types::U128;
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{env, near, AccountId, NearToken, PanicOnDefault, Promise};

/// Minimum bond required to submit a quote (0.1 NEAR).
const MIN_BOND_YOCTO: u128 = 100_000_000_000_000_000_000_000; // 0.1 NEAR
/// Protocol fee taken from bond on successful settlement (1%).
const SUCCESS_FEE_BPS: u128 = 100; // 1% = 100 bps

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, PartialEq, Debug)]
#[borsh(crate = "near_sdk::borsh")]
#[serde(crate = "near_sdk::serde")]
pub enum IntentStatus {
    Open,
    Quoted,
    Selected,
    Settling,
    Completed,
    Failed,
    Expired,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, PartialEq, Debug)]
#[borsh(crate = "near_sdk::borsh")]
#[serde(crate = "near_sdk::serde")]
pub enum BondState {
    None,
    Locked,
    Released,
    Slashed,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, Debug)]
#[borsh(crate = "near_sdk::borsh")]
#[serde(crate = "near_sdk::serde")]
pub struct Quote {
    pub solver: AccountId,
    pub quoted_amount: u128,
    pub bond_amount: u128,
    pub submitted_at_ms: u64,
    pub active: bool,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, Debug)]
#[borsh(crate = "near_sdk::borsh")]
#[serde(crate = "near_sdk::serde")]
pub struct Intent {
    pub intent_id: String,
    pub creator: AccountId,
    pub destination_chain: String,
    pub recipient_address: String,
    pub amount_min: u128,
    pub deadline_ms: u64,
    pub status: IntentStatus,
    pub created_at_ms: u64,
    pub winner: Option<AccountId>,
    pub winner_quote_index: Option<u64>,
    pub btc_tx_hash: Option<String>,
    pub bond_state: BondState,
    pub locked_bond: u128,
    pub treasury_slashed: u128,
}

/// View-friendly bond state response.
#[derive(Serialize, Deserialize, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct BondStateView {
    pub state: BondState,
    pub locked_amount: U128,
    pub solver: Option<AccountId>,
    pub treasury_slashed: U128,
}

/// Serializable intent for views (amounts as U128).
#[derive(Serialize, Deserialize, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct IntentView {
    pub intent_id: String,
    pub creator: AccountId,
    pub destination_chain: String,
    pub recipient_address: String,
    pub amount_min: U128,
    pub deadline_ms: u64,
    pub status: IntentStatus,
    pub created_at_ms: u64,
    pub winner: Option<AccountId>,
    pub btc_tx_hash: Option<String>,
    pub bond_state: BondState,
    pub locked_bond: U128,
    pub quote_count: u64,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct QuoteView {
    pub solver: AccountId,
    pub quoted_amount: U128,
    pub bond_amount: U128,
    pub submitted_at_ms: u64,
    pub active: bool,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Covenant {
    /// intent_id -> Intent
    intents: UnorderedMap<String, Intent>,
    /// intent_id -> quotes
    quotes: LookupMap<String, Vector<Quote>>,
    /// Sequential counter for intent ids.
    next_intent_id: u64,
    /// Protocol treasury account that receives slashed bonds / fees.
    treasury: AccountId,
    /// Owner / admin.
    owner: AccountId,
}

#[near]
impl Covenant {
    #[init]
    pub fn new(treasury: AccountId) -> Self {
        assert!(!env::state_exists(), "Already initialized");
        Self {
            intents: UnorderedMap::new(b"i"),
            quotes: LookupMap::new(b"q"),
            next_intent_id: 1,
            treasury,
            owner: env::predecessor_account_id(),
        }
    }

    /// Post a new remittance / swap intent.
    /// Returns the new `intent_id`.
    pub fn post_intent(
        &mut self,
        destination_chain: String,
        recipient_address: String,
        amount_min: U128,
        deadline_ms: u64,
    ) -> String {
        assert!(!destination_chain.is_empty(), "destination_chain required");
        assert!(!recipient_address.is_empty(), "recipient_address required");
        assert!(amount_min.0 > 0, "amount_min must be > 0");
        let now = env::block_timestamp_ms();
        assert!(deadline_ms > now, "deadline_ms must be in the future");

        let intent_id = format!("covenant-{}", self.next_intent_id);
        self.next_intent_id += 1;

        let intent = Intent {
            intent_id: intent_id.clone(),
            creator: env::predecessor_account_id(),
            destination_chain,
            recipient_address,
            amount_min: amount_min.0,
            deadline_ms,
            status: IntentStatus::Open,
            created_at_ms: now,
            winner: None,
            winner_quote_index: None,
            btc_tx_hash: None,
            bond_state: BondState::None,
            locked_bond: 0,
            treasury_slashed: 0,
        };

        self.intents.insert(&intent_id, &intent);
        let quotes = Vector::new(format!("q:{}", intent_id).as_bytes().to_vec());
        self.quotes.insert(&intent_id, &quotes);

        env::log_str(&format!("Intent posted: {}", intent_id));
        intent_id
    }

    /// Solver submits a quote and locks attached NEAR as bond.
    /// Attached deposit MUST equal `bond_amount` and be >= MIN_BOND_YOCTO.
    #[payable]
    pub fn submit_quote(
        &mut self,
        intent_id: String,
        quoted_amount: U128,
        bond_amount: U128,
    ) {
        let mut intent = self.intents.get(&intent_id).expect("Intent not found");

        assert!(
            matches!(intent.status, IntentStatus::Open | IntentStatus::Quoted),
            "Intent not accepting quotes"
        );
        assert!(
            env::block_timestamp_ms() < intent.deadline_ms,
            "Intent deadline passed"
        );
        assert!(quoted_amount.0 > 0, "quoted_amount must be > 0");
        assert!(
            quoted_amount.0 >= intent.amount_min,
            "quoted_amount below amount_min"
        );
        assert!(
            bond_amount.0 >= MIN_BOND_YOCTO,
            "bond_amount below minimum (0.1 NEAR)"
        );

        let attached = env::attached_deposit().as_yoctonear();
        assert_eq!(
            attached, bond_amount.0,
            "Attached deposit must equal bond_amount"
        );

        let solver = env::predecessor_account_id();
        let quote = Quote {
            solver: solver.clone(),
            quoted_amount: quoted_amount.0,
            bond_amount: bond_amount.0,
            submitted_at_ms: env::block_timestamp_ms(),
            active: true,
        };

        let mut quotes = self.quotes.get(&intent_id).expect("Quotes storage missing");
        quotes.push(&quote);
        self.quotes.insert(&intent_id, &quotes);

        intent.status = IntentStatus::Quoted;
        self.intents.insert(&intent_id, &intent);

        env::log_str(&format!(
            "Quote from {} on {}: quoted={} bond={}",
            solver, intent_id, quoted_amount.0, bond_amount.0
        ));
    }

    /// Select the winning quote. Prototype heuristic: highest quoted_amount,
    /// ties broken by highest bond. Callable by intent creator or owner.
    pub fn select_winner(&mut self, intent_id: String) {
        let mut intent = self.intents.get(&intent_id).expect("Intent not found");

        assert!(
            matches!(
                intent.status,
                IntentStatus::Quoted | IntentStatus::Open
            ),
            "Intent not in selectable state"
        );
        assert!(
            env::predecessor_account_id() == intent.creator
                || env::predecessor_account_id() == self.owner,
            "Only creator or owner can select winner"
        );
        assert!(
            env::block_timestamp_ms() < intent.deadline_ms,
            "Intent deadline passed"
        );

        let mut quotes = self.quotes.get(&intent_id).expect("Quotes storage missing");
        assert!(quotes.len() > 0, "No quotes to select");

        // Only consider active quotes (inactive = already refunded / slashed).
        let mut best_idx: Option<u64> = None;
        let mut best: Option<Quote> = None;
        for i in 0..quotes.len() {
            let q = quotes.get(i).unwrap();
            if !q.active {
                continue;
            }
            let take = match &best {
                None => true,
                Some(b) => {
                    q.quoted_amount > b.quoted_amount
                        || (q.quoted_amount == b.quoted_amount
                            && q.bond_amount > b.bond_amount)
                }
            };
            if take {
                best_idx = Some(i);
                best = Some(q);
            }
        }
        let best_idx = best_idx.expect("No active quotes");
        let best = best.expect("No active quotes");

        // Refund and deactivate non-winning solvers so bonds cannot be relocked.
        for i in 0..quotes.len() {
            if i == best_idx {
                continue;
            }
            let mut q = quotes.get(i).unwrap();
            if !q.active {
                continue;
            }
            if q.bond_amount > 0 {
                let _ = Promise::new(q.solver.clone())
                    .transfer(NearToken::from_yoctonear(q.bond_amount));
            }
            q.active = false;
            quotes.replace(i, &q);
        }
        self.quotes.insert(&intent_id, &quotes);

        intent.winner = Some(best.solver.clone());
        intent.winner_quote_index = Some(best_idx);
        intent.locked_bond = best.bond_amount;
        intent.bond_state = BondState::Locked;
        intent.status = IntentStatus::Selected;
        self.intents.insert(&intent_id, &intent);

        env::log_str(&format!(
            "Winner selected for {}: {} bond_locked={}",
            intent_id, best.solver, best.bond_amount
        ));
    }

    /// Winning solver submits a Bitcoin (testnet) settlement proof.
    /// Hackathon verification: non-empty tx hash, called by winner, before deadline.
    pub fn submit_settlement_proof(&mut self, intent_id: String, btc_tx_hash: String) {
        let mut intent = self.intents.get(&intent_id).expect("Intent not found");

        assert!(
            matches!(
                intent.status,
                IntentStatus::Selected | IntentStatus::Settling
            ),
            "Intent not awaiting settlement"
        );
        assert!(intent.bond_state == BondState::Locked, "Bond not locked");
        let winner = intent.winner.clone().expect("No winner");
        assert_eq!(
            env::predecessor_account_id(),
            winner,
            "Only winning solver can submit proof"
        );
        assert!(
            env::block_timestamp_ms() < intent.deadline_ms,
            "Deadline passed — use slash_and_handover"
        );
        assert!(!btc_tx_hash.is_empty(), "btc_tx_hash required");
        assert!(btc_tx_hash.len() >= 16, "btc_tx_hash looks invalid");

        let locked = intent.locked_bond;
        assert!(locked > 0, "No bond locked");

        let fee = locked
            .checked_mul(SUCCESS_FEE_BPS)
            .unwrap()
            .checked_div(10_000)
            .unwrap();
        let refund = locked.saturating_sub(fee);

        if fee > 0 {
            let _ = Promise::new(self.treasury.clone())
                .transfer(NearToken::from_yoctonear(fee));
        }
        if refund > 0 {
            let _ = Promise::new(winner.clone())
                .transfer(NearToken::from_yoctonear(refund));
        }

        intent.btc_tx_hash = Some(btc_tx_hash.clone());
        intent.bond_state = BondState::Released;
        intent.locked_bond = 0;
        intent.status = IntentStatus::Completed;
        self.intents.insert(&intent_id, &intent);

        env::log_str(&format!(
            "Settlement proof accepted for {}: btc_tx={} fee={} refund={}",
            intent_id, btc_tx_hash, fee, refund
        ));
    }

    /// Anyone can call after deadline (or via demo "Simulate Failure") to slash
    /// the locked bond and re-open the intent for the next solver.
    pub fn slash_and_handover(&mut self, intent_id: String) {
        let mut intent = self.intents.get(&intent_id).expect("Intent not found");

        assert!(
            matches!(
                intent.status,
                IntentStatus::Selected | IntentStatus::Settling | IntentStatus::Quoted
            ),
            "Intent not slashable"
        );
        assert!(
            intent.bond_state == BondState::Locked,
            "No locked bond to slash"
        );

        let now = env::block_timestamp_ms();
        let caller = env::predecessor_account_id();
        let is_privileged = caller == self.owner || caller == intent.creator;
        // Demo / simulate-failure: creator or owner may slash early.
        // Anyone may slash after deadline.
        assert!(
            is_privileged || now >= intent.deadline_ms,
            "Too early to slash; wait for deadline or use owner/creator simulate"
        );

        let slashed = intent.locked_bond;
        if slashed > 0 {
            let _ = Promise::new(self.treasury.clone())
                .transfer(NearToken::from_yoctonear(slashed));
        }

        if let Some(idx) = intent.winner_quote_index {
            if let Some(mut quotes) = self.quotes.get(&intent_id) {
                if let Some(mut q) = quotes.get(idx) {
                    q.active = false;
                    quotes.replace(idx, &q);
                    self.quotes.insert(&intent_id, &quotes);
                }
            }
        }

        intent.treasury_slashed = intent.treasury_slashed.saturating_add(slashed);
        intent.locked_bond = 0;
        intent.bond_state = BondState::Slashed;
        intent.winner = None;
        intent.winner_quote_index = None;
        intent.btc_tx_hash = None;

        let remaining = self.count_active_quotes(&intent_id);
        if remaining > 0 {
            intent.status = IntentStatus::Quoted;
            intent.bond_state = BondState::None;
            env::log_str(&format!(
                "Slashed {} on {}; re-opened for {} remaining quotes",
                slashed, intent_id, remaining
            ));
        } else {
            intent.status = IntentStatus::Failed;
            env::log_str(&format!(
                "Slashed {} on {}; no remaining quotes — Failed",
                slashed, intent_id
            ));
        }

        self.intents.insert(&intent_id, &intent);
    }

    /// After deadline, refund any still-active unselected quote bonds.
    /// Prevents deposits from being trapped when `select_winner` can no longer run.
    pub fn refund_expired_quotes(&mut self, intent_id: String) {
        let mut intent = self.intents.get(&intent_id).expect("Intent not found");
        assert!(
            matches!(
                intent.status,
                IntentStatus::Open | IntentStatus::Quoted
            ),
            "Intent has a locked winner or is already terminal"
        );
        assert!(
            intent.bond_state == BondState::None,
            "Bond already locked — use slash_and_handover or settlement"
        );
        assert!(
            env::block_timestamp_ms() >= intent.deadline_ms,
            "Deadline not reached"
        );

        let mut refunded = 0u64;
        if let Some(mut quotes) = self.quotes.get(&intent_id) {
            for i in 0..quotes.len() {
                let mut q = quotes.get(i).unwrap();
                if !q.active {
                    continue;
                }
                if q.bond_amount > 0 {
                    let _ = Promise::new(q.solver.clone())
                        .transfer(NearToken::from_yoctonear(q.bond_amount));
                }
                q.active = false;
                quotes.replace(i, &q);
                refunded += 1;
            }
            self.quotes.insert(&intent_id, &quotes);
        }

        intent.status = IntentStatus::Expired;
        self.intents.insert(&intent_id, &intent);

        env::log_str(&format!(
            "Expired {} — refunded {} unselected quote bond(s)",
            intent_id, refunded
        ));
    }

    // ─── Views ───────────────────────────────────────────────────────────

    pub fn get_intent(&self, intent_id: String) -> Option<IntentView> {
        self.intents.get(&intent_id).map(|i| {
            let quote_count = self
                .quotes
                .get(&intent_id)
                .map(|q| q.len())
                .unwrap_or(0);
            IntentView {
                intent_id: i.intent_id,
                creator: i.creator,
                destination_chain: i.destination_chain,
                recipient_address: i.recipient_address,
                amount_min: U128(i.amount_min),
                deadline_ms: i.deadline_ms,
                status: i.status,
                created_at_ms: i.created_at_ms,
                winner: i.winner,
                btc_tx_hash: i.btc_tx_hash,
                bond_state: i.bond_state,
                locked_bond: U128(i.locked_bond),
                quote_count,
            }
        })
    }

    pub fn get_bond_state(&self, intent_id: String) -> BondStateView {
        match self.intents.get(&intent_id) {
            Some(i) => BondStateView {
                state: i.bond_state,
                locked_amount: U128(i.locked_bond),
                solver: i.winner,
                treasury_slashed: U128(i.treasury_slashed),
            },
            None => BondStateView {
                state: BondState::None,
                locked_amount: U128(0),
                solver: None,
                treasury_slashed: U128(0),
            },
        }
    }

    pub fn get_quotes(&self, intent_id: String) -> Vec<QuoteView> {
        match self.quotes.get(&intent_id) {
            Some(quotes) => {
                let mut out = Vec::new();
                for i in 0..quotes.len() {
                    let q = quotes.get(i).unwrap();
                    out.push(QuoteView {
                        solver: q.solver,
                        quoted_amount: U128(q.quoted_amount),
                        bond_amount: U128(q.bond_amount),
                        submitted_at_ms: q.submitted_at_ms,
                        active: q.active,
                    });
                }
                out
            }
            None => Vec::new(),
        }
    }

    pub fn list_intent_ids(&self) -> Vec<String> {
        self.intents.keys().collect()
    }

    pub fn get_treasury(&self) -> AccountId {
        self.treasury.clone()
    }

    pub fn get_owner(&self) -> AccountId {
        self.owner.clone()
    }

    fn count_active_quotes(&self, intent_id: &str) -> u64 {
        match self.quotes.get(&intent_id.to_string()) {
            Some(quotes) => {
                let mut n = 0u64;
                for i in 0..quotes.len() {
                    if quotes.get(i).unwrap().active {
                        n += 1;
                    }
                }
                n
            }
            None => 0,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::{accounts, VMContextBuilder};
    use near_sdk::{testing_env, AccountId};

    fn context(predecessor: AccountId, deposit: u128, ts_ms: u64) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder
            .predecessor_account_id(predecessor)
            .attached_deposit(NearToken::from_yoctonear(deposit))
            .block_timestamp(ts_ms * 1_000_000); // ns
        builder
    }

    #[test]
    fn post_intent_and_quote_locks_bond() {
        let treasury: AccountId = accounts(0);
        testing_env!(context(accounts(1), 0, 1_000).build());
        let mut c = Covenant::new(treasury);

        let id = c.post_intent(
            "bitcoin-testnet".into(),
            "tb1qtestrecipient".into(),
            U128(10_000),
            10_000,
        );

        let bond = MIN_BOND_YOCTO;
        testing_env!(context(accounts(2), bond, 2_000).build());
        c.submit_quote(id.clone(), U128(10_000), U128(bond));

        let intent = c.get_intent(id.clone()).unwrap();
        assert_eq!(intent.status, IntentStatus::Quoted);
        assert_eq!(intent.quote_count, 1);

        testing_env!(context(accounts(1), 0, 3_000).build());
        c.select_winner(id.clone());
        let bond_state = c.get_bond_state(id.clone());
        assert_eq!(bond_state.state, BondState::Locked);
        assert_eq!(bond_state.locked_amount.0, bond);
    }

    #[test]
    fn settlement_releases_bond() {
        let treasury: AccountId = accounts(0);
        testing_env!(context(accounts(1), 0, 1_000).build());
        let mut c = Covenant::new(treasury);
        let id = c.post_intent(
            "bitcoin-testnet".into(),
            "tb1qtest".into(),
            U128(1),
            50_000,
        );
        let bond = MIN_BOND_YOCTO;
        testing_env!(context(accounts(2), bond, 2_000).build());
        c.submit_quote(id.clone(), U128(1), U128(bond));
        testing_env!(context(accounts(1), 0, 3_000).build());
        c.select_winner(id.clone());

        testing_env!(context(accounts(2), 0, 4_000).build());
        c.submit_settlement_proof(id.clone(), "abcdef0123456789deadbeef".into());
        let bond_state = c.get_bond_state(id);
        assert_eq!(bond_state.state, BondState::Released);
        assert_eq!(bond_state.locked_amount.0, 0);
    }

    #[test]
    fn slash_after_deadline() {
        let treasury: AccountId = accounts(0);
        testing_env!(context(accounts(1), 0, 1_000).build());
        let mut c = Covenant::new(treasury);
        let id = c.post_intent(
            "bitcoin-testnet".into(),
            "tb1qtest".into(),
            U128(1),
            5_000,
        );
        let bond = MIN_BOND_YOCTO;
        testing_env!(context(accounts(2), bond, 2_000).build());
        c.submit_quote(id.clone(), U128(1), U128(bond));
        testing_env!(context(accounts(1), 0, 3_000).build());
        c.select_winner(id.clone());

        testing_env!(context(accounts(3), 0, 6_000).build());
        c.slash_and_handover(id.clone());
        let bond_state = c.get_bond_state(id.clone());
        assert_eq!(bond_state.state, BondState::Slashed);
        assert_eq!(bond_state.treasury_slashed.0, bond);
        let intent = c.get_intent(id).unwrap();
        assert_eq!(intent.status, IntentStatus::Failed);
    }
}
