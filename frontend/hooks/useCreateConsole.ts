"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getBondState,
  getIntent,
  getQuotes,
  listIntentIds,
  listIntentIdsSoft,
} from "@/lib/contract";
import { connectWallet, WalletAccount } from "@/lib/wallet";
import { errorMessage } from "@/lib/errors";
import { runHappyPathDemo, runSlashPathDemo } from "@/lib/demo-paths";
import { nextActionFor } from "@/lib/next-action";
import type { IntentFormValues } from "@/components/IntentForm";
import {
  ActivityItem,
  DEMO_SOLVER,
  MockIntent,
  addQuote,
  createMockIntent,
  demoBtcTxHash,
  derivationPath,
  loadActivity,
  loadIntentHistory,
  loadPersistedMock,
  persistMock,
  pushActivity,
  selectWinner,
  settleSuccess,
  slashAndHandover,
} from "@/lib/mock-store";

export function useCreateConsole() {
  const [wallet, setWallet] = useState<WalletAccount | null>(null);
  const [busy, setBusy] = useState(false);
  const [booting, setBooting] = useState(true);
  const [status, setStatus] = useState("");
  const [active, setActive] = useState<MockIntent | null>(null);
  const [history, setHistory] = useState<MockIntent[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [localMode, setLocalMode] = useState(true);

  const note = useCallback((message: string) => {
    setStatus(message);
    setActivity((prev) => [pushActivity(message), ...prev].slice(0, 40));
  }, []);

  const setAndPersist = useCallback(
    (intent: MockIntent | null, msg?: string) => {
      setActive(intent);
      persistMock(intent);
      setHistory(loadIntentHistory());
      if (msg) note(msg);
    },
    [note]
  );

  const refreshFromChain = useCallback(async (intentId: string) => {
    try {
      const [intent, quotes, bond] = await Promise.all([
        getIntent(intentId),
        getQuotes(intentId).catch(() => []),
        getBondState(intentId),
      ]);
      if (!intent) return null;
      const bondView = bond ?? {
        state: intent.bond_state,
        locked_amount: intent.locked_bond,
        solver: intent.winner,
        treasury_slashed: "0",
      };
      return {
        ...intent,
        quotes,
        bond: bondView,
        bond_state: bond ? bond.state : intent.bond_state,
        locked_bond: bond?.locked_amount || intent.locked_bond,
        derivation_path: derivationPath(intent.intent_id),
      } satisfies MockIntent;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    setActivity(loadActivity());
    setHistory(loadIntentHistory());
    const cached = loadPersistedMock();
    if (cached) {
      setActive(cached);
      setLocalMode(true);
    }
    // Show the offline console immediately — do not block on RPC.
    setBooting(false);
    void (async () => {
      try {
        const ids = await listIntentIdsSoft();
        if (!ids.length) {
          setLocalMode(true);
          return;
        }
        const latest = await refreshFromChain(ids[ids.length - 1]);
        if (latest) {
          setActive(latest);
          setLocalMode(false);
          persistMock(latest);
          setHistory(loadIntentHistory());
        }
      } catch {
        setLocalMode(true);
      }
    })();
  }, [refreshFromChain]);

  async function ensureWallet() {
    if (wallet) return wallet;
    const next = await connectWallet();
    setWallet(next);
    note(
      next.accountId.includes("demo-user")
        ? `Demo wallet ready (${next.accountId}) — no login required.`
        : `Wallet connected: ${next.accountId}`
    );
    return next;
  }

  async function handlePost(values: IntentFormValues) {
    setBusy(true);
    setStatus("");
    try {
      const account = await ensureWallet();
      const args = {
        destination_chain: "bitcoin-testnet",
        recipient_address: values.recipient,
        amount_min: values.amountMin,
        deadline_ms: Date.now() + Number(values.deadlineMinutes) * 60_000,
      };
      const result = await account.signAndSend("post_intent", args);
      if (result.demo || localMode) {
        setLocalMode(true);
        const intent = createMockIntent({
          recipient: values.recipient,
          amountMin: values.amountMin,
          deadlineMinutes: Number(values.deadlineMinutes),
          creator: account.accountId,
        });
        setAndPersist(intent, `Intent ${intent.intent_id} posted (local stub).`);
      } else {
        const ids = await listIntentIds();
        const latestId = ids[ids.length - 1];
        const refreshed = latestId ? await refreshFromChain(latestId) : null;
        if (refreshed) setAndPersist(refreshed, "Intent posted on-chain.");
      }
    } catch (err) {
      note(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleQuoteDemo() {
    if (!active) return;
    setBusy(true);
    try {
      const account = await ensureWallet();
      if (localMode) {
        setAndPersist(
          addQuote(active, DEMO_SOLVER),
          "Solver locked 0.1 NEAR bond."
        );
      } else {
        await account.signAndSend(
          "submit_quote",
          {
            intent_id: active.intent_id,
            quoted_amount: active.amount_min,
            bond_amount: "100000000000000000000000",
          },
          "100000000000000000000000"
        );
        const refreshed = await refreshFromChain(active.intent_id);
        if (refreshed) setAndPersist(refreshed, "Quote and bond submitted.");
      }
    } catch (err) {
      note(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleSelectWinner() {
    if (!active) return;
    setBusy(true);
    try {
      const account = await ensureWallet();
      if (localMode) {
        const next = selectWinner(active);
        setAndPersist(
          next,
          `Winner ${next.winner}. Bond locked. Path ${next.derivation_path}`
        );
      } else {
        await account.signAndSend("select_winner", {
          intent_id: active.intent_id,
        });
        const refreshed = await refreshFromChain(active.intent_id);
        if (refreshed) setAndPersist(refreshed, "Winner selected on-chain.");
      }
    } catch (err) {
      note(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleSettleDemo() {
    if (!active) return;
    setBusy(true);
    try {
      const account = await ensureWallet();
      if (localMode || account.demo) {
        const tx = demoBtcTxHash(active.intent_id);
        setLocalMode(true);
        setAndPersist(
          settleSuccess(active, tx),
          "Settlement proof accepted. Bond released."
        );
      } else {
        // Never submit the demo placeholder hash on-chain — live settlement
        // must come from the solver with a real BTC tx hash.
        note(
          "Live settlement requires a real Bitcoin tx hash from the solver (`npx tsx solver.ts --intent … --settle-only`). Demo settle stays local-only."
        );
      }
    } catch (err) {
      note(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleSimulateFailure() {
    if (!active) return;
    setBusy(true);
    try {
      const account = await ensureWallet();
      if (localMode) {
        const next = slashAndHandover(active);
        setAndPersist(
          next,
          next.bond.state === "Slashed"
            ? "Bond slashed to treasury. Intent failed."
            : "Bond slashed; intent reopened for remaining quotes."
        );
      } else {
        await account.signAndSend("slash_and_handover", {
          intent_id: active.intent_id,
        });
        const refreshed = await refreshFromChain(active.intent_id);
        if (refreshed) setAndPersist(refreshed, "slash_and_handover submitted.");
      }
    } catch (err) {
      note(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function runHappyPath() {
    setBusy(true);
    setLocalMode(true);
    try {
      await ensureWallet();
      await runHappyPathDemo(setAndPersist);
    } catch (err) {
      note(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function runSlashPath() {
    setBusy(true);
    setLocalMode(true);
    try {
      await ensureWallet();
      await runSlashPathDemo(setAndPersist);
    } catch (err) {
      note(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function startNewIntent() {
    setActive(null);
    persistMock(null);
    note("Ready for a new intent.");
  }

  function selectFromShelf(intent: MockIntent) {
    void (async () => {
      // Prefer chain state when the shelf row looks live; keep stub rows local.
      const looksStub =
        intent.creator?.startsWith("demo-user.") ||
        intent.intent_id.startsWith("local-") ||
        intent.intent_id.startsWith("demo-");
      if (!looksStub) {
        const refreshed = await refreshFromChain(intent.intent_id);
        if (refreshed) {
          setLocalMode(false);
          setAndPersist(refreshed, `Loaded live ${refreshed.intent_id}`);
          return;
        }
      }
      setLocalMode(true);
      setActive(intent);
      persistMock(intent);
      note(`Loaded stub ${intent.intent_id}`);
    })();
  }

  const nextAction = useMemo(() => {
    if (!active) {
      return {
        title: "Post an intent",
        detail:
          "Start with a Bitcoin testnet recipient and minimum sats, or run a one-click walkthrough.",
        tone: "neutral" as const,
      };
    }
    return nextActionFor({
      status: active.status,
      bond: active.bond.state,
      quoteCount: active.quotes.length,
    });
  }, [active]);

  return {
    wallet,
    busy,
    booting,
    status,
    active,
    history,
    activity,
    localMode,
    nextAction,
    ensureWallet,
    handlePost,
    handleQuoteDemo,
    handleSelectWinner,
    handleSettleDemo,
    handleSimulateFailure,
    runHappyPath,
    runSlashPath,
    startNewIntent,
    selectFromShelf,
  };
}
