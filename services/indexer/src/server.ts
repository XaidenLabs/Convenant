import "dotenv/config";
import http from "node:http";
import { URL } from "node:url";
import { IntentStore } from "./store.js";
import { syncFromChain } from "./sync.js";
import { CONTRACT_ID, NETWORK } from "./near.js";

const PORT = Number(process.env.PORT || 8787);
const DATA_PATH = process.env.INDEXER_DATA || "./data/intents.json";
const POLL_MS = Number(process.env.INDEXER_POLL_MS || 20_000);

const store = new IntentStore(DATA_PATH);

type SyncState = {
  syncing: boolean;
  last_sync_at_ms: number;
  last_sync_count: number;
  last_error: string | null;
  consecutive_errors: number;
  next_sync_at_ms: number;
};

const syncState: SyncState = {
  syncing: false,
  last_sync_at_ms: 0,
  last_sync_count: 0,
  last_error: null,
  consecutive_errors: 0,
  next_sync_at_ms: 0,
};

function json(
  res: http.ServerResponse,
  status: number,
  body: unknown,
  extraHeaders: Record<string, string> = {}
) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...extraHeaders,
  });
  res.end(payload);
}

async function runSync(trigger: "boot" | "poll" | "manual"): Promise<number> {
  if (syncState.syncing) {
    throw new Error("sync already in flight");
  }
  syncState.syncing = true;
  try {
    const count = await syncFromChain(store);
    syncState.last_sync_at_ms = Date.now();
    syncState.last_sync_count = count;
    syncState.last_error = null;
    syncState.consecutive_errors = 0;
    console.log(`[indexer] ${trigger} sync ok · ${count} intents`);
    return count;
  } catch (err) {
    syncState.consecutive_errors += 1;
    syncState.last_error = err instanceof Error ? err.message : String(err);
    throw err;
  } finally {
    syncState.syncing = false;
    syncState.next_sync_at_ms = Date.now() + POLL_MS;
  }
}

function healthPayload() {
  const stats = store.stats(NETWORK, CONTRACT_ID);
  return {
    ok: true,
    service: "covenant-indexer",
    network: NETWORK,
    contract_id: CONTRACT_ID,
    poll_ms: POLL_MS,
    syncing: syncState.syncing,
    // 0 means this process has not completed a chain sync yet — do not
    // fall back to the file-store timestamp or the UI invents a sync time.
    last_sync_at_ms: syncState.last_sync_at_ms,
    last_sync_count: syncState.last_sync_count,
    last_error: syncState.last_error,
    consecutive_errors: syncState.consecutive_errors,
    next_sync_at_ms: syncState.next_sync_at_ms,
    intent_count: stats.intent_count,
    source: "chain" as const,
  };
}

const server = http.createServer(async (req, res) => {
  if (!req.url || !req.method) {
    json(res, 400, { error: "bad request" });
    return;
  }

  if (req.method === "OPTIONS") {
    json(res, 204, {});
    return;
  }

  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

  try {
    if (req.method === "GET" && url.pathname === "/health") {
      json(res, 200, healthPayload());
      return;
    }

    if (req.method === "GET" && url.pathname === "/v1/meta") {
      json(res, 200, {
        ...healthPayload(),
        stats: store.stats(NETWORK, CONTRACT_ID),
        endpoints: [
          "GET /health",
          "GET /v1/meta",
          "GET /v1/stats",
          "GET /v1/intents",
          "GET /v1/intents/:id",
          "POST /v1/sync",
        ],
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/v1/stats") {
      json(res, 200, {
        ...store.stats(NETWORK, CONTRACT_ID),
        syncing: syncState.syncing,
        last_error: syncState.last_error,
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/v1/intents") {
      const status = url.searchParams.get("status") || undefined;
      const q = url.searchParams.get("q") || undefined;
      const limit = Number(url.searchParams.get("limit") || 50);
      json(res, 200, {
        items: store.listIntents({ status, q, limit }),
      });
      return;
    }

    const intentMatch = url.pathname.match(/^\/v1\/intents\/([^/]+)$/);
    if (req.method === "GET" && intentMatch) {
      const intent = store.getIntent(decodeURIComponent(intentMatch[1]));
      if (!intent) {
        json(res, 404, { error: "not found" });
        return;
      }
      json(res, 200, {
        intent,
        quotes: store.getQuotes(intent.intent_id),
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/v1/sync") {
      try {
        const count = await runSync("manual");
        json(res, 200, {
          synced: count,
          stats: store.stats(NETWORK, CONTRACT_ID),
          health: healthPayload(),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("already in flight")) {
          // Join the in-flight sync instead of pretending every failure is 409.
          json(res, 200, {
            synced: null,
            pending: true,
            error: message,
            health: healthPayload(),
          });
          return;
        }
        json(res, 500, {
          error: message,
          health: healthPayload(),
        });
      }
      return;
    }

    json(res, 404, { error: "not found" });
  } catch (err) {
    json(res, 500, {
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

async function boot() {
  if (store.listIntents().length === 0) {
    console.log(
      "[indexer] empty store — syncing live chain views (no dummy seed)"
    );
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(
      `Covenant indexer listening on :${PORT} · ${NETWORK} · ${CONTRACT_ID}`
    );
  });

  const poll = async () => {
    try {
      await runSync("poll");
    } catch (err) {
      console.warn(
        "[indexer] chain sync skipped:",
        err instanceof Error ? err.message : err
      );
      syncState.next_sync_at_ms = Date.now() + POLL_MS;
    }
  };

  await poll();
  setInterval(poll, POLL_MS);
}

boot().catch((err) => {
  console.error(err);
  process.exit(1);
});
