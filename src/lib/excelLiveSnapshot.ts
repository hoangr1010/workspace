// PLAN 1.8 — Per-file registry of "give me your live Univer snapshot" callbacks.
// ExcelViewer registers its workbook's `FWorkbook.save` getter on mount;
// the .xlsx save path in registerViewers.tsx pulls it out at save time so
// Univer's in-memory edits get serialized instead of the stale file-open snapshot.
//
// The whole module is one Map. Three functions are one line each.
// The Map and real bodies land in slice 3 of the TDD plan; this is the slice-0 stub.

type SnapshotGetter = () => Record<string, unknown>;

export function register(_filePath: string, _getter: SnapshotGetter): void {
  // stub — slice 3 wires this to getters.set(_filePath, _getter)
}

export function unregister(_filePath: string): void {
  // stub — slice 3 wires this to getters.delete(_filePath)
}

export function getSnapshot(_filePath: string): Record<string, unknown> | undefined {
  // stub — slice 3 wires this to getters.get(_filePath)?.()
  return undefined;
}
