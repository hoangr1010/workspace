// PLAN 1.6 / 1.8 — Excel handlers (SheetJS ↔ Univer snapshot)
// Implements WindowApi.{openExcel, saveExcel}.
// See src/types/ipc.ts and docs/architecture.md → "File type handling / Excel".

import type { ExcelFileData } from '../../src/types/file';

export async function openExcel(filePath: string): Promise<ExcelFileData> {
  throw new Error(`PLAN 1.6 — openExcel not implemented (path: ${filePath})`);
}

export async function saveExcel(filePath: string, snapshot: Record<string, unknown>): Promise<void> {
  throw new Error(`PLAN 1.8 — saveExcel not implemented (path: ${filePath}, keys: ${Object.keys(snapshot).length})`);
}
