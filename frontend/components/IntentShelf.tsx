"use client";

import type { MockIntent } from "@/lib/mock-store";
import { BondBadge } from "./BondBadge";
import { PreviewList } from "./PreviewList";

export function IntentShelf({
  items,
  activeId,
  onSelect,
}: {
  items: MockIntent[];
  activeId?: string | null;
  onSelect: (intent: MockIntent) => void;
}) {
  return (
    <PreviewList
      items={items}
      pinnedKey={activeId}
      modalTitle="All intents"
      empty={
        <div className="px-4 py-6 text-sm text-mist/40">
          No intents in this session yet. Post one or run a walkthrough.
        </div>
      }
      getKey={(intent) => intent.intent_id}
      renderItem={(intent, _index, { closeModal }) => {
        const selected = intent.intent_id === activeId;
        return (
          <button
            type="button"
            onClick={() => {
              onSelect(intent);
              closeModal();
            }}
            className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-gold ${
              selected ? "bg-gold/10" : "hover:bg-white/[0.03]"
            }`}
          >
            <div className="min-w-0">
              <p className="truncate font-mono text-xs text-mist/70">
                {intent.intent_id}
              </p>
              <p className="mt-1 text-sm text-mist/90">{intent.status}</p>
            </div>
            <BondBadge state={intent.bond.state} />
          </button>
        );
      }}
    />
  );
}
