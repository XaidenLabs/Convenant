"use client";

export function ModeBanner({ localMode }: { localMode: boolean }) {
  if (localMode) {
    return (
      <div
        role="status"
        className="border border-amber-400/30 bg-amber-400/5 px-4 py-3 text-sm text-amber-100/90"
      >
        <p className="font-medium text-amber-200">Local stub mode</p>
        <p className="mt-1 text-amber-100/70">
          Bond states mirror the on-chain contract without requiring keys. Connect
          a live NEAR wallet and deployed contract to switch to write-path mode.
        </p>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="border border-emerald-400/30 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-100/90"
    >
      <p className="font-medium text-emerald-200">Live contract views</p>
      <p className="mt-1 text-emerald-100/70">
        Reading and writing against the deployed Covenant contract. Wallet
        signatures are required for state changes.
      </p>
    </div>
  );
}
