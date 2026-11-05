/**
 * Covenant solver — quote + bond, settle BTC via NEAR Chain Signatures, submit proof.
 *
 * Usage:
 *   npx tsx solver.ts --dry-run --mock --intent covenant-demo-1
 *   npx tsx solver.ts --derive-only --intent covenant-1
 *   npx tsx solver.ts --intent covenant-1 --quote-only          ★ keys
 *   npx tsx solver.ts --intent covenant-1 --settle-only         ★ keys + BTC funds
 *   npx tsx solver.ts --intent covenant-1                       ★ full live path
 *
 * Offline completeness:
 *   --dry-run  → prints full planned Chain Signatures flow (no keys)
 *   --mock     → uses in-memory intent (no deployed contract)
 *   --derive-only → attempts real address derivation (needs egress; no private key)
 *
 * BTC signing support: YES — chainsig.js `chainAdapters.btc.Bitcoin` (P2WPKH)
 * against MPC `v1.signer-prod.testnet`. See lib/chainsig-btc.ts header table.
 */

import "dotenv/config";
import {
  ACCOUNT_ID,
  CONTRACT_ID,
  MPC_CONTRACT_ID,
  NETWORK,
  derivationPathFor,
  hasNearKeys,
} from "./lib/config.js";
import {
  deriveIntentBtcAddress,
  settleBtcWithChainSignatures,
} from "./lib/chainsig-btc.js";
import {
  getIntent,
  listIntentIds,
  mockIntent,
  submitQuote,
  submitSettlementProof,
  type IntentView,
} from "./lib/covenant-contract.js";
import { loadNearAccount } from "./lib/near-account.js";

type CliArgs = {
  intent?: string;
  quoteOnly: boolean;
  dryRun: boolean;
  settleOnly: boolean;
  deriveOnly: boolean;
  mock: boolean;
};

function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = {
    quoteOnly: false,
    dryRun: false,
    settleOnly: false,
    deriveOnly: false,
    mock: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--intent") out.intent = argv[++i];
    else if (a === "--quote-only") out.quoteOnly = true;
    else if (a === "--settle-only") out.settleOnly = true;
    else if (a === "--derive-only") out.deriveOnly = true;
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--mock") out.mock = true;
  }
  return out;
}

async function resolveIntent(args: CliArgs): Promise<IntentView> {
  let intentId = args.intent;

  if (args.mock) {
    intentId = intentId || `covenant-mock-${Date.now()}`;
    const intent = mockIntent(intentId);
    console.log("Using --mock intent (no contract call)");
    return intent;
  }

  if (!intentId) {
    const ids = await listIntentIds();
    intentId = ids[ids.length - 1];
  }
  if (!intentId) {
    throw new Error(
      "No intent id. Pass --intent <id>, or --mock for offline, or deploy the contract."
    );
  }

  const loaded = await getIntent(intentId);
  if (!loaded) throw new Error(`Intent not found: ${intentId}`);
  return loaded;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dry = args.dryRun || !hasNearKeys();

  console.log("Covenant solver");
  console.log({
    NETWORK,
    ACCOUNT_ID: ACCOUNT_ID || "(unset)",
    CONTRACT_ID,
    MPC_CONTRACT_ID,
    dryRun: dry,
    mock: args.mock,
    hasNearKeys: hasNearKeys(),
  });
  console.log(
    "BTC signing support: YES (chainsig.js P2WPKH ↔ v1.signer-prod.testnet)"
  );

  const intent = await resolveIntent(args);
  console.log("Intent:", {
    id: intent.intent_id,
    status: intent.status,
    recipient: intent.recipient_address,
    amount_min: intent.amount_min,
    path: derivationPathFor(intent.intent_id),
  });

  if (args.deriveOnly) {
    console.log("→ derive-only (no private key required for known MPC)");
    try {
      const derived = await deriveIntentBtcAddress(intent.intent_id);
      console.log("✓ derived:", derived);
      console.log(
        "Next: fund this address on Bitcoin testnet, then --settle-only with keys."
      );
    } catch (err) {
      console.error("Derive failed (needs egress to NEAR/MPC or local KDF):", err);
      console.log(
        "Offline fallback path would be:",
        derivationPathFor(intent.intent_id)
      );
      console.log("Re-run with --dry-run --mock to print the full planned flow.");
      process.exitCode = 1;
    }
    return;
  }

  const account = dry ? null : await loadNearAccount();

  const alreadySelected =
    intent.status === "Selected" || intent.status === "Settling";

  if (!args.settleOnly) {
    if (alreadySelected) {
      console.log(
        `Intent already ${intent.status} — skipping quote, continuing to settlement.`
      );
    } else if (intent.status === "Open" || intent.status === "Quoted") {
      await submitQuote(account, intent, dry);
    } else {
      console.log(
        `Intent status is ${intent.status}. Cannot quote; use --settle-only after a winner is selected.`
      );
      return;
    }
  }
  if (args.quoteOnly) {
    console.log(
      "Quote-only done. Select winner in UI, then: --settle-only --intent",
      intent.intent_id
    );
    return;
  }

  if (
    !dry &&
    !args.mock &&
    intent.status !== "Selected" &&
    intent.status !== "Settling"
  ) {
    console.log(
      `Intent status is ${intent.status}. Select a winner in the UI, then re-run --settle-only.`
    );
    return;
  }

  const result = await settleBtcWithChainSignatures({
    intent,
    account,
    dryRun: dry,
  });

  await submitSettlementProof(
    account,
    intent.intent_id,
    result.txHash,
    dry || result.dryRun
  );

  console.log("Done.", {
    txHash: result.txHash,
    explorer: result.explorerUrl,
    derived: result.derived.address,
    dryRun: result.dryRun,
  });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
