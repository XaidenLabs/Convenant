import {
  DEMO_SOLVER,
  MockIntent,
  addQuote,
  createMockIntent,
  demoBtcTxHash,
  selectWinner,
  settleSuccess,
  slashAndHandover,
} from "./mock-store";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const DEMO_RECIPIENT = "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx";

type StepReporter = (intent: MockIntent, message: string) => void;

async function baseIntent(report: StepReporter): Promise<MockIntent> {
  const intent = createMockIntent({
    recipient: DEMO_RECIPIENT,
    amountMin: "10000",
    deadlineMinutes: 30,
  });
  report(intent, "Intent posted.");
  await sleep(320);
  return intent;
}

/** Offline judge path: intent → quote → select → settle → bond released. */
export async function runHappyPathDemo(report: StepReporter): Promise<void> {
  let intent = await baseIntent(report);

  intent = addQuote(intent, DEMO_SOLVER);
  report(intent, "Solver quoted and locked a 0.1 NEAR bond.");
  await sleep(320);

  intent = selectWinner(intent);
  report(intent, `Winner selected (${intent.winner}). Bond locked.`);
  await sleep(320);

  intent = settleSuccess(intent, demoBtcTxHash(intent.intent_id));
  report(
    intent,
    "Settlement proof accepted. Bond released. For live BTC, run solver/solver.ts."
  );
}

/** Offline judge path: intent → quote → select → slash. */
export async function runSlashPathDemo(report: StepReporter): Promise<void> {
  let intent = await baseIntent(report);

  intent = addQuote(intent, DEMO_SOLVER);
  report(intent, "Solver quoted and locked a 0.1 NEAR bond.");
  await sleep(320);

  intent = selectWinner(intent);
  report(intent, `Winner selected (${intent.winner}). Bond locked.`);
  await sleep(320);

  intent = slashAndHandover(intent);
  report(
    intent,
    intent.bond.state === "Slashed"
      ? "Simulate Failure complete. Bond slashed to treasury."
      : "Bond slashed; intent reopened for remaining quotes."
  );
}
