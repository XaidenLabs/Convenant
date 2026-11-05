"use client";

import { useState, type ReactNode } from "react";
import { Modal } from "@/components/Modal";
import {
  LIST_PREVIEW_LIMIT,
  hasMoreItems,
  previewWithPinned,
} from "@/lib/list-preview";

/**
 * Dashboard list: show latest N rows, View more opens a modal with the full list.
 * When `pinnedKey` is set, that row stays in the preview even outside the window.
 */
export function PreviewList<T>({
  items,
  limit = LIST_PREVIEW_LIMIT,
  modalTitle,
  empty,
  renderItem,
  getKey,
  pinnedKey,
}: {
  items: T[];
  limit?: number;
  modalTitle: string;
  empty: ReactNode;
  renderItem: (
    item: T,
    index: number,
    ctx: { closeModal: () => void }
  ) => ReactNode;
  getKey: (item: T, index: number) => string;
  pinnedKey?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const preview = previewWithPinned(items, limit, pinnedKey, getKey);
  const more = hasMoreItems(items, limit);
  const closeModal = () => setOpen(false);
  const ctx = { closeModal };

  if (!items.length) {
    return <>{empty}</>;
  }

  return (
    <>
      <ul className="divide-y divide-white/10" aria-hidden={open || undefined}>
        {preview.map((item, index) => (
          <li key={getKey(item, index)}>{renderItem(item, index, ctx)}</li>
        ))}
      </ul>
      {more ? (
        <div className="border-t border-white/10 px-4 py-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-xs text-gold transition-colors hover:text-gold-soft"
          >
            View more ({items.length - limit} more) · all {items.length}
          </button>
        </div>
      ) : null}

      <Modal open={open} title={modalTitle} onClose={closeModal} wide>
        <ul className="divide-y divide-white/10 border border-white/10">
          {items.map((item, index) => (
            <li key={getKey(item, index)}>{renderItem(item, index, ctx)}</li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
