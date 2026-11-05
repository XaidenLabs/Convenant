/**
 * Poll live Covenant contract for open intents and optionally auto-quote.
 * No mocks — contract views only.
 *
 *   npx tsx scripts/watch-intents.ts
 *   npx tsx scripts/watch-intents.ts --auto-quote --interval 15
 *   npx tsx scripts/watch-intents.ts --once
 */

import "dotenv/config";
import { ACCOUNT_ID, CONTRACT_ID, NETWORK, hasNearKeys } from "../lib/config.js";
import {
  getIntent,
  listIntentIds,
  submitQuote,
  viewCall,
} from "../lib/covenant-contract.js";
import { loadNearAccount } from "../lib/near-account.js";

type QuoteRow = {
  solver: string;
  active: boolean;
};

async function solverAlreadyQuoted(intentId: string, solver: string) {
  try {
    const quotes = await viewCall<QuoteRow[]>("get_quotes", {
      intent_id: intentId,
    });
    return (quotes || []).some(
      (q) => q.active && q.solver === solver
    );
  } catch {
    return false;
  }
}

function parseArgs(argv: string[]) {
  let interval = 20;
  let autoQuote = false;
  let once = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--interval") interval = Number(argv[++i] || 20);
    if (argv[i] === "--auto-quote") autoQuote = true;
    if (argv[i] === "--once") once = true;
  }
  return { interval, autoQuote, once };
}

async function tick(autoQuote: boolean) {
  const ids = await listIntentIds();
  if (!ids.length) {
    console.log(
      JSON.stringify({
        ts: Date.now(),
        event: "empty_book",
        contract: CONTRACT_ID,
        network: NETWORK,
      })
    );
    return;
  }

  for (const id of ids) {
    const intent = await getIntent(id);
    if (!intent) continue;

    console.log(
      JSON.stringify({
        ts: Date.now(),
        event: "intent",
        intent_id: intent.intent_id,
        status: intent.status,
        bond_state: intent.bond_state ?? null,
        winner: intent.winner,
        amount_min: intent.amount_min,
      })
    );

    if (
      autoQuote &&
      (intent.status === "Open" || intent.status === "Quoted") &&
      !intent.winner
    ) {
      if (await solverAlreadyQuoted(intent.intent_id, ACCOUNT_ID)) {
        console.log(
          JSON.stringify({
            ts: Date.now(),
            event: "quote_skip",
            reason: "already_quoted",
            intent_id: intent.intent_id,
            solver: ACCOUNT_ID,
          })
        );
        continue;
      }
      const account = await loadNearAccount();
      await submitQuote(account, intent, false);
      console.log(
        JSON.stringify({
          ts: Date.now(),
          event: "quoted",
          intent_id: intent.intent_id,
          solver: ACCOUNT_ID,
        })
      );
    }
  }
}

async function main() {
  const { interval, autoQuote, once } = parseArgs(process.argv.slice(2));
  console.log(
    JSON.stringify({
      ts: Date.now(),
      event: "watch_start",
      network: NETWORK,
      contract: CONTRACT_ID,
      interval,
      autoQuote,
      hasKeys: hasNearKeys(),
    })
  );

  if (autoQuote && !hasNearKeys()) {
    console.warn(
      JSON.stringify({
        ts: Date.now(),
        event: "warn",
        message: "auto-quote requested but NEAR keys missing; watch-only",
      })
    );
  }

  do {
    try {
      await tick(autoQuote && hasNearKeys());
    } catch (err) {
      console.error(
        JSON.stringify({
          ts: Date.now(),
          event: "error",
          message: err instanceof Error ? err.message : String(err),
        })
      );
    }
    if (once) break;
    await new Promise((r) => setTimeout(r, interval * 1000));
  } while (!once);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
