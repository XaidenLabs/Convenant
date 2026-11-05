/** Latest-N preview for dashboard lists. Full set opens in View more modal. */
export const LIST_PREVIEW_LIMIT = 5;

export function previewSlice<T>(items: T[], limit = LIST_PREVIEW_LIMIT): T[] {
  return items.slice(0, limit);
}

/** Keep the selected row visible even when it falls outside the latest-N window. */
export function previewWithPinned<T>(
  items: T[],
  limit: number,
  pinnedKey: string | null | undefined,
  getKey: (item: T, index: number) => string
): T[] {
  const preview = previewSlice(items, limit);
  if (!pinnedKey) return preview;
  if (preview.some((item, index) => getKey(item, index) === pinnedKey)) {
    return preview;
  }
  const pinnedIndex = items.findIndex(
    (item, index) => getKey(item, index) === pinnedKey
  );
  if (pinnedIndex < 0) return preview;
  const pinned = items[pinnedIndex];
  return [pinned, ...preview.slice(0, Math.max(0, limit - 1))];
}

export function hasMoreItems<T>(items: T[], limit = LIST_PREVIEW_LIMIT): boolean {
  return items.length > limit;
}
