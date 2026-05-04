// PLAN 1.8 — Per-file "live snapshot getter" registry.
// ExcelViewer registers a getter on mount; the .xlsx save path calls it to
// pull Univer's post-edit snapshot (the file-open snapshot is stale).
// See docs/architecture.md → "File type handling / Excel".

import type { UniverSnapshot } from '../types/file';

type SnapshotGetter = () => UniverSnapshot;

// filePath → getter that returns the mounted ExcelViewer's current Univer state.
const getters = new Map<string, SnapshotGetter>();

export function register(filePath: string, getter: SnapshotGetter): void {
  getters.set(filePath, getter);
}

export function unregister(filePath: string): void {
  getters.delete(filePath);
}

export function getSnapshot(filePath: string): UniverSnapshot | undefined {
  return getters.get(filePath)?.();
}
