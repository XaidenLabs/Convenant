/**
 * Deploy covenant.wasm to NEAR_ACCOUNT_ID and init with treasury = same account.
 */
import "dotenv/config";
import { readFileSync } from "fs";
import { connect, keyStores, KeyPair, utils } from "near-api-js";

const NETWORK = process.env.NEAR_NETWORK || "testnet";
const ACCOUNT_ID = process.env.NEAR_ACCOUNT_ID!;
const PRIVATE_KEY = process.env.NEAR_PRIVATE_KEY!;
const RPC =
  NETWORK === "mainnet"
    ? "https://rpc.mainnet.near.org"
    : "https://rpc.testnet.near.org";
const WASM =
  process.env.WASM_PATH || "/agent/covenant/res/covenant.wasm";

async function main() {
  if (!ACCOUNT_ID || !PRIVATE_KEY) {
    throw new Error("NEAR_ACCOUNT_ID and NEAR_PRIVATE_KEY required");
  }
  const keyStore = new keyStores.InMemoryKeyStore();
  await keyStore.setKey(NETWORK, ACCOUNT_ID, KeyPair.fromString(PRIVATE_KEY as never));
  const near = await connect({ networkId: NETWORK, nodeUrl: RPC, keyStore });
  const account = await near.account(ACCOUNT_ID);
  const wasm = readFileSync(WASM);

  console.log(`Deploying ${WASM} (${wasm.length} bytes) → ${ACCOUNT_ID}`);
  const deployOutcome = await account.deployContract(wasm);
  const deployTx =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (deployOutcome as any)?.transaction?.hash ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (deployOutcome as any)?.transaction_outcome?.id;
  console.log("deploy tx:", deployTx);
  console.log("https://testnet.nearblocks.io/txns/" + deployTx);

  // Init if not already initialized
  try {
    const state = await account.viewFunction({
      contractId: ACCOUNT_ID,
      methodName: "get_owner",
      args: {},
    });
    console.log("Already initialized. owner=", state);
  } catch {
    console.log("Calling new(treasury)...");
    const initOutcome = await account.functionCall({
      contractId: ACCOUNT_ID,
      methodName: "new",
      args: { treasury: ACCOUNT_ID },
      gas: BigInt("30000000000000"),
      attachedDeposit: BigInt(0),
    });
    const initTx =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (initOutcome as any)?.transaction?.hash ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (initOutcome as any)?.transaction_outcome?.id;
    console.log("init tx:", initTx);
    console.log("https://testnet.nearblocks.io/txns/" + initTx);
  }

  const owner = await account.viewFunction({
    contractId: ACCOUNT_ID,
    methodName: "get_owner",
    args: {},
  });
  const treasury = await account.viewFunction({
    contractId: ACCOUNT_ID,
    methodName: "get_treasury",
    args: {},
  });
  console.log({ owner, treasury, contract: ACCOUNT_ID });
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
