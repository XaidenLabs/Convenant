import type { BondState, IntentStatus } from "@/lib/contract";

export type NextAction = {
  title: string;
  detail: string;
  tone: "neutral" | "gold" | "danger" | "success";
};

export function nextActionFor(input: {
  status: IntentStatus;
  bond: BondState;
  quoteCount: number;
}): NextAction {
  const { status, bond, quoteCount } = input;

  if (status === "Completed" || bond === "Released") {
    return {
      title: "Settlement complete",
      detail: "Bond released. Open the Bitcoin tx link to verify delivery.",
      tone: "success",
    };
  }
  if (status === "Failed" || bond === "Slashed") {
    return {
      title: "Bond slashed",
      detail: "Treasury received the slash. Post a new intent or reopen with another quote.",
      tone: "danger",
    };
  }
  if (status === "Open" && quoteCount === 0) {
    return {
      title: "Waiting for solvers",
      detail: "Add a demo quote here, or run the solver console / worker against this intent.",
      tone: "neutral",
    };
  }
  if (status === "Quoted" || (status === "Open" && quoteCount > 0)) {
    return {
      title: "Select a winner",
      detail: "Choosing a winner locks the best quote’s bond and starts the settlement window.",
      tone: "gold",
    };
  }
  if (status === "Selected" || status === "Settling") {
    return {
      title: "Settle or slash",
      detail:
        "Trigger settlement after Chain Signatures BTC delivery — or Simulate Failure to slash.",
      tone: "gold",
    };
  }
  return {
    title: "Continue the flow",
    detail: "Use the controls below to advance this intent.",
    tone: "neutral",
  };
}
