/**
 * Seed is DISABLED for production-like demos.
 * Covenant must show live NEAR data only.
 *
 * This script now wipes any local cache so stale dummy rows cannot linger.
 *
 *   npm run seed   → clears ./data/intents.json
 *   npm start      → syncs from chain on boot
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DATA_PATH = process.env.INDEXER_DATA || "./data/intents.json";

mkdirSync(dirname(DATA_PATH), { recursive: true });
writeFileSync(
  DATA_PATH,
  JSON.stringify({ intents: [], quotes: [], synced_at_ms: Date.now() }, null, 2)
);

console.log(
  `Cleared indexer store at ${DATA_PATH}. No dummy rows. Run the indexer to sync live chain state.`
);
