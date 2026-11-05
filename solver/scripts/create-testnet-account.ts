/**
 * Generate a NEAR testnet keypair + preferred account id for Covenant.
 * Tries helper faucet create; always writes secrets for manual funding.
 */
import { KeyPair } from "near-api-js";
import { mkdirSync, writeFileSync } from "fs";

async function main() {
  const kp = KeyPair.fromRandom("ed25519");
  const publicKey = kp.getPublicKey().toString();
  const privateKey = kp.toString();
  const data = (kp.getPublicKey() as { data: Uint8Array }).data;
  const implicitId = Buffer.from(data).toString("hex");
  const accountId = `covenant-solver-${Date.now().toString(36)}.testnet`;

  mkdirSync("/agent/covenant/secrets", { recursive: true });
  const cred = {
    account_id: accountId,
    implicit_id: implicitId,
    public_key: publicKey,
    private_key: privateKey,
    network: "testnet",
    created_at: new Date().toISOString(),
    note: "Fund account_id via NEAR testnet faucet; use for deploy + solver.",
  };
  writeFileSync(
    "/agent/covenant/secrets/near-solver.testnet.json",
    JSON.stringify(cred, null, 2)
  );
  writeFileSync("/agent/covenant/secrets/near-solver.testnet.key", privateKey + "\n", {
    mode: 0o600,
  });

  console.log(
    JSON.stringify(
      {
        accountId,
        implicitId,
        publicKey,
        secretsPath: "/agent/covenant/secrets/near-solver.testnet.json",
      },
      null,
      2
    )
  );

  const endpoints = [
    "https://helper.testnet.near.org/account",
    "https://testnet-api.kitwallet.app/account",
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newAccountId: accountId,
          newAccountPublicKey: publicKey,
        }),
      });
      const text = await res.text();
      console.log(`CREATE ${url} -> ${res.status} ${text.slice(0, 400)}`);
    } catch (e) {
      console.log(`CREATE ${url} -> FAIL ${String(e)}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
