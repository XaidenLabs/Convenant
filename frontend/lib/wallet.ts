/**
 * NEAR wallet adapter for Covenant.
 * Uses @hot-labs/near-connect for real chain calls; demo stub only when
 * NEXT_PUBLIC_DEMO_MODE is not "0" and no wallet is available.
 */

import { NearConnector, type NearWalletBase } from "@hot-labs/near-connect";
import { CONTRACT_ID, NETWORK } from "./contract";

export type WalletAccount = {
  accountId: string;
  demo?: boolean;
  signAndSend: (
    method: string,
    args: Record<string, unknown>,
    depositYocto?: string
  ) => Promise<{ transaction_outcome?: { id?: string }; demo?: boolean }>;
};

declare global {
  interface Window {
    near?: {
      connection?: unknown;
      accountId?: string;
      requestSignIn?: () => Promise<void>;
      signAndSendTransaction?: (tx: unknown) => Promise<unknown>;
    };
  }
}

let connector: NearConnector | null = null;
let connectedWallet: NearWalletBase | null = null;
let demoAccount: string | null = null;

function demoAllowed(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE !== "0";
}

async function getConnector(): Promise<NearConnector> {
  if (!connector) {
    connector = new NearConnector({
      network: NETWORK === "mainnet" ? "mainnet" : "testnet",
      features: {
        signAndSendTransaction: true,
        ...(NETWORK === "mainnet" ? { mainnet: true } : { testnet: true }),
      },
    });
    await connector.whenManifestLoaded;
  }
  return connector;
}

function accountFromWallet(
  wallet: NearWalletBase,
  accountId: string
): WalletAccount {
  return {
    accountId,
    demo: false,
    signAndSend: async (method, args, depositYocto = "0") => {
      const result = await wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: CONTRACT_ID,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: method,
              args,
              gas: "30000000000000",
              deposit: depositYocto,
            },
          },
        ],
      });
      const hash =
        (result as { transaction?: { hash?: string } })?.transaction?.hash ||
        (result as { transaction_outcome?: { id?: string } })?.transaction_outcome
          ?.id;
      return { transaction_outcome: { id: hash } };
    },
  };
}

function demoWallet(): WalletAccount {
  if (!demoAccount) {
    demoAccount = `demo-user.${NETWORK}`;
  }
  return {
    accountId: demoAccount,
    demo: true,
    signAndSend: async (method, args, depositYocto = "0") => {
      console.info("[Covenant demo wallet]", {
        contract: CONTRACT_ID,
        method,
        args,
        depositYocto,
      });
      const key = "covenant:demo:actions";
      const prev = JSON.parse(sessionStorage.getItem(key) || "[]") as unknown[];
      prev.push({
        at: Date.now(),
        method,
        args,
        depositYocto,
      });
      sessionStorage.setItem(key, JSON.stringify(prev));
      return { demo: true, transaction_outcome: { id: `demo-${Date.now()}` } };
    },
  };
}

export function isDemoMode(): boolean {
  return typeof window !== "undefined" && !connectedWallet && demoAllowed();
}

export async function connectWallet(): Promise<WalletAccount> {
  if (typeof window === "undefined") {
    throw new Error("Wallet only available in browser");
  }

  // Prefer already-injected NEAR wallets when fully ready.
  if (window.near?.accountId && window.near.signAndSendTransaction) {
    const accountId = window.near.accountId;
    return {
      accountId,
      demo: false,
      signAndSend: async (method, args, depositYocto = "0") => {
        const result = await window.near!.signAndSendTransaction!({
          receiverId: CONTRACT_ID,
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: method,
                args,
                gas: "30000000000000",
                deposit: depositYocto,
              },
            },
          ],
        });
        return result as { transaction_outcome?: { id?: string } };
      },
    };
  }

  // Real wallet via near-connect (HOT / MyNearWallet / etc.).
  try {
    const c = await getConnector();
    const wallet = await c.connect();
    connectedWallet = wallet;
    const accounts = await wallet.getAccounts();
    const accountId = accounts[0]?.accountId;
    if (!accountId) {
      throw new Error("Wallet connected but no account returned");
    }
    return accountFromWallet(wallet, accountId);
  } catch (err) {
    console.warn("[Covenant] near-connect failed", err);
    if (!demoAllowed()) {
      throw err instanceof Error
        ? err
        : new Error("Wallet connection failed");
    }
  }

  // Demo fallback for offline / judge walkthrough only.
  return demoWallet();
}

export async function disconnectWallet() {
  demoAccount = null;
  if (connector && connectedWallet) {
    try {
      await connector.disconnect(connectedWallet);
    } catch {
      // ignore
    }
  }
  connectedWallet = null;
}
