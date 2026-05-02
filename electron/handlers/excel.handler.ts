// PLAN 1.6 / 1.8 — Excel handlers (SheetJS ↔ Univer snapshot)
// Implements WindowApi.{openExcel, saveExcel}.
// See src/types/ipc.ts and docs/architecture.md → "File type handling / Excel".

import { readFileSync } from 'fs';
import * as XLSX from 'xlsx';
import type { ExcelFileData } from '../../src/types/file';
import { workbookToUniverSnapshot } from '../lib/excel-converter';

export async function openExcel(filePath: string): Promise<ExcelFileData> {
  // Read raw bytes from disk (main process only — file paths never reach the renderer)
  const buffer = readFileSync(filePath);

  // Parse the XLSX binary: cellStyles reads formatting, cellFormula reads formulas, cellDates parses date cells
  const wb = XLSX.read(buffer, { type: 'buffer', cellStyles: true, cellFormula: true, cellDates: true });

  // Convert SheetJS workbook → Univer snapshot (values, formulas, styles, layout)
  const snapshot = workbookToUniverSnapshot(wb);
  return { kind: 'excel', snapshot };
}

// saveExcel is PLAN 1.8 — will read the snapshot back from Univer and write via SheetJS
export async function saveExcel(filePath: string, snapshot: Record<string, unknown>): Promise<void> {
  throw new Error(`PLAN 1.8 — saveExcel not implemented (path: ${filePath}, keys: ${Object.keys(snapshot).length})`);
}
