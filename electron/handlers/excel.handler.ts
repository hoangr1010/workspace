// PLAN 1.6 / 1.8 — Excel handlers (SheetJS ↔ Univer snapshot)
// Implements WindowApi.{openExcel, saveExcel}.
// See src/types/ipc.ts and docs/architecture.md → "File type handling / Excel".

import { readFileSync, promises as fsp } from 'fs';
import * as XLSX from 'xlsx';
import type { ExcelFileData } from '../../src/types/file';
import { workbookToUniverSnapshot, univerSnapshotToWorkbook } from '../lib/excel-converter';

export async function openExcel(filePath: string): Promise<ExcelFileData> {
  // Read raw bytes from disk (main process only — file paths never reach the renderer)
  const buffer = readFileSync(filePath);

  // Parse the XLSX binary: cellStyles reads formatting, cellFormula reads formulas, cellDates parses date cells
  const wb = XLSX.read(buffer, { type: 'buffer', cellStyles: true, cellFormula: true, cellDates: true });

  // Convert SheetJS workbook → Univer snapshot (values, formulas, styles, layout)
  const snapshot = workbookToUniverSnapshot(wb);
  return { kind: 'excel', snapshot };
}

export async function saveExcel(filePath: string, snapshot: Record<string, unknown>): Promise<void> {
  const wb = univerSnapshotToWorkbook(snapshot);
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', cellStyles: true });
  await fsp.writeFile(filePath, buf as Buffer);
}
