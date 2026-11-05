const NETWORK = process.env.NETWORK || "testnet";
export const CONTRACT_ID =
  process.env.CONTRACT_ID ||
  process.env.NEXT_PUBLIC_CONTRACT_ID ||
  "covenant-solver-mw2mng1b.testnet";

const RPC =
  process.env.NEAR_RPC ||
  (NETWORK === "mainnet"
    ? "https://free.rpc.fastnear.com"
    : "https://test.rpc.fastnear.com");

export async function viewFunction<T>(
  methodName: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "covenant-indexer",
      method: "query",
      params: {
        request_type: "call_function",
        finality: "optimistic",
        account_id: CONTRACT_ID,
        method_name: methodName,
        args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
      },
    }),
  });
  const json = (await res.json()) as {
    error?: { message?: string };
    result?: { result?: number[]; error?: string };
  };
  if (json.error && !json.result) {
    throw new Error(json.error.message || "RPC error");
  }
  if (!json.result) throw new Error(json.error?.message || "Empty RPC result");
  if (json.result.error && !json.result.result) {
    throw new Error(json.result.error);
  }
  const text = Buffer.from(json.result.result || []).toString("utf8");
  return text ? (JSON.parse(text) as T) : (null as T);
}

export { NETWORK };
