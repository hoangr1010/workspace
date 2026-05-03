// PLAN 1.8 — Per-file registry of "give me your live Univer snapshot" callbacks.
// ExcelViewer registers its workbook's snapshot getter on mount; the .xlsx
// save path in registerViewers.tsx pulls it out at save time so Univer's
// in-memory edits get serialized instead of the stale file-open snapshot.
//
// The whole module is one Map. Each function is one line.

type SnapshotGetter = () => Record<string, unknown>;

const getters = new Map<string, SnapshotGetter>();

export function register(filePath: string, getter: SnapshotGetter): void {
  getters.set(filePath, getter);
}

export function unregister(filePath: string): void {
  getters.delete(filePath);
}

export function getSnapshot(filePath: string): Record<string, unknown> | undefined {
  return getters.get(filePath)?.();
}
