/**
 * Live Covenant demo on NEAR testnet + Bitcoin testnet.
 *
 * Modes:
 *   --happy   post → quote+bond → select → Chain Sig BTC → proof (default)
 *   --slash   post → quote+bond → select → slash_and_handover
 *
 * Env from solver/.env
 */
import "dotenv/config";
import { connect, keyStores, KeyPair } from "near-api-js";
import {
  ACCOUNT_ID,
  BOND_YOCTO,
  CONTRACT_ID,
  NETWORK,
  PRIVATE_KEY,
  RPC,
  derivationPathFor,
} from "../lib/config.js";
import { settleBtcWithChainSignatures } from "../lib/chainsig-btc.js";
import { loadNearAccount } from "../lib/near-account.js";

type Mode = "happy" | "slash";

function parseMode(argv: string[]): Mode {
  if (argv.includes("--slash")) return "slash";
  return "happy";
}

function txHash(outcome: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o = outcome as any;
  return (
    o?.transaction?.hash ||
    o?.transaction_outcome?.id ||
    o?.transaction_outcome?.block_hash ||
    "unknown"
  );
}

function nearLink(hash: string) {
  return `https://testnet.nearblocks.io/txns/${hash}`;
}

async function main() {
  const mode = parseMode(process.argv.slice(2));
  if (!ACCOUNT_ID || !PRIVATE_KEY) throw new Error("Missing NEAR keys");

  const account = await loadNearAccount();
  if (!account) throw new Error("Failed to load NEAR account");

  const links: Record<string, string> = {};
  const now = Date.now();
  const deadlineMs = now + 60 * 60_000; // 1h
  const amountMin = "10000"; // sats
  // Recipient: classic example tb1 (P2WPKH) — funds leave our derived address
  const recipient = "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx";

  console.log("=== Covenant live demo ===", { mode, CONTRACT_ID, ACCOUNT_ID });

  // 1) post_intent
  const post = await account.functionCall({
    contractId: CONTRACT_ID,
    methodName: "post_intent",
    args: {
      destination_chain: "bitcoin-testnet",
      recipient_address: recipient,
      amount_min: amountMin,
      deadline_ms: deadlineMs,
    },
    gas: BigInt("30000000000000"),
    attachedDeposit: BigInt(0),
  });
  const postHash = txHash(post);
  links.post_intent = nearLink(postHash);
  console.log("post_intent", postHash, links.post_intent);

  // Read latest intent id
  const ids = (await account.viewFunction({
    contractId: CONTRACT_ID,
    methodName: "list_intent_ids",
    args: {},
  })) as string[];
  const intentId = ids[ids.length - 1];
  console.log("intent_id", intentId, "path", derivationPathFor(intentId));
  links.intent_id = intentId;

  // 2) submit_quote + bond
  const quote = await account.functionCall({
    contractId: CONTRACT_ID,
    methodName: "submit_quote",
    args: {
      intent_id: intentId,
      quoted_amount: amountMin,
      bond_amount: BOND_YOCTO,
    },
    gas: BigInt("30000000000000"),
    attachedDeposit: BigInt(BOND_YOCTO),
  });
  const quoteHash = txHash(quote);
  links.bond_lock = nearLink(quoteHash);
  console.log("submit_quote", quoteHash, links.bond_lock);

  // 3) select_winner
  const win = await account.functionCall({
    contractId: CONTRACT_ID,
    methodName: "select_winner",
    args: { intent_id: intentId },
    gas: BigInt("30000000000000"),
    attachedDeposit: BigInt(0),
  });
  const winHash = txHash(win);
  links.select_winner = nearLink(winHash);
  console.log("select_winner", winHash, links.select_winner);

  const bondBefore = await account.viewFunction({
    contractId: CONTRACT_ID,
    methodName: "get_bond_state",
    args: { intent_id: intentId },
  });
  console.log("bond_state after select", bondBefore);

  if (mode === "slash") {
    const slash = await account.functionCall({
      contractId: CONTRACT_ID,
      methodName: "slash_and_handover",
      args: { intent_id: intentId },
      gas: BigInt("30000000000000"),
      attachedDeposit: BigInt(0),
    });
    const slashHash = txHash(slash);
    links.slash = nearLink(slashHash);
    console.log("slash_and_handover", slashHash, links.slash);
    const bondAfter = await account.viewFunction({
      contractId: CONTRACT_ID,
      methodName: "get_bond_state",
      args: { intent_id: intentId },
    });
    const intent = await account.viewFunction({
      contractId: CONTRACT_ID,
      methodName: "get_intent",
      args: { intent_id: intentId },
    });
    console.log("RESULT_JSON", JSON.stringify({ mode, links, bondAfter, intent }, null, 2));
    return;
  }

  // 4) Chain Signatures BTC settle
  const settlement = await settleBtcWithChainSignatures({
    intent: {
      intent_id: intentId,
      recipient_address: recipient,
      amount_min: amountMin,
    },
    account,
    dryRun: false,
    feeBufferSats: 800,
  });
  links.btc_tx = settlement.explorerUrl;
  links.btc_tx_hash = settlement.txHash;
  links.derived_btc = settlement.derived.address;
  links.mpc = settlement.derived.mpcContract;
  console.log("btc settlement", settlement);

  // 5) submit_settlement_proof
  const proof = await account.functionCall({
    contractId: CONTRACT_ID,
    methodName: "submit_settlement_proof",
    args: {
      intent_id: intentId,
      btc_tx_hash: settlement.txHash,
    },
    gas: BigInt("30000000000000"),
    attachedDeposit: BigInt(0),
  });
  const proofHash = txHash(proof);
  links.bond_release = nearLink(proofHash);
  console.log("submit_settlement_proof", proofHash, links.bond_release);

  const bondAfter = await account.viewFunction({
    contractId: CONTRACT_ID,
    methodName: "get_bond_state",
    args: { intent_id: intentId },
  });
  const intent = await account.viewFunction({
    contractId: CONTRACT_ID,
    methodName: "get_intent",
    args: { intent_id: intentId },
  });

  console.log("RESULT_JSON", JSON.stringify({ mode, links, bondAfter, intent }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
