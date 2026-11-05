/**
 * NEAR account loader + chainsig.js signerAccount bridge.
 *
 * ★ Requires NEAR_ACCOUNT_ID + NEAR_PRIVATE_KEY for live MPC `sign` calls
 *   and Covenant contract change methods.
 */

import {
  ACCOUNT_ID,
  NETWORK,
  PRIVATE_KEY,
  RPC,
  hasNearKeys,
} from "./config.js";

export type NearAccount = Awaited<ReturnType<typeof loadNearAccount>>;

export async function loadNearAccount() {
  if (!hasNearKeys()) return null;

  const nearAPI = await import("near-api-js");
  const { connect, keyStores, KeyPair } = nearAPI;
  const keyStore = new keyStores.InMemoryKeyStore();
  const keyPair = KeyPair.fromString(PRIVATE_KEY as never);
  await keyStore.setKey(NETWORK, ACCOUNT_ID, keyPair);
  const near = await connect({
    networkId: NETWORK,
    nodeUrl: RPC,
    keyStore,
  });
  return near.account(ACCOUNT_ID);
}

/**
 * Adapter that satisfies chainsig.js `signerAccount.signAndSendTransactions`
 * using a near-api-js Account (server-side solver).
 */
export function toSignerAccount(account: NonNullable<NearAccount>) {
  return {
    accountId: ACCOUNT_ID,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signAndSendTransactions: async ({
      transactions,
    }: {
      transactions: Array<{
        receiverId: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        actions: any[];
      }>;
    }) => {
      const outcomes = [];
      for (const tx of transactions) {
        // near-api-js Account.signAndSendTransaction accepts receiverId + actions
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const outcome = await (account as any).signAndSendTransaction({
          receiverId: tx.receiverId,
          actions: tx.actions,
        });
        outcomes.push(outcome);
      }
      return outcomes;
    },
  };
}
