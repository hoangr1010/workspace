import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import * as XLSX from 'xlsx';
import { openExcel, saveExcel } from '../excel.handler';

describe('excel.handler — saveExcel disk round-trip', () => {
  let dir: string;
  let xlsxPath: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'excel-handler-test-'));
    xlsxPath = join(dir, 'roundtrip.xlsx');

    // Write a small known workbook to disk via SheetJS so openExcel has
    // something real to read.
    const wb = XLSX.utils.book_new();
    const ws: XLSX.WorkSheet = {
      A1: { t: 's', v: 'name' },
      B1: { t: 's', v: 'qty' },
      A2: { t: 's', v: 'apple' },
      B2: { t: 'n', v: 5 },
      A3: { t: 's', v: 'pear' },
      B3: { t: 'n', v: 3 },
      '!ref': 'A1:B3',
    };
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    writeFileSync(xlsxPath, buf as Buffer);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('open → save → reopen preserves cell values', async () => {
    // 1. Open: file → Univer snapshot
    const opened = await openExcel(xlsxPath);
    expect(opened.kind).toBe('excel');

    // 2. Save: Univer snapshot → file
    await saveExcel(xlsxPath, opened.snapshot);

    // 3. Reopen: file → Univer snapshot, expect the same cells
    const reopened = await openExcel(xlsxPath);
    const sheets = reopened.snapshot.sheets as Record<string, Record<string, unknown>>;
    const sheetOrder = reopened.snapshot.sheetOrder as string[];
    const firstSheet = sheets[sheetOrder[0] as string] as Record<string, unknown>;
    const cellData = firstSheet.cellData as Record<number, Record<number, Record<string, unknown>>>;

    // A1 = 'name', B2 = 5, A3 = 'pear'
    expect((cellData[0] as Record<number, Record<string, unknown>>)[0]).toMatchObject({ v: 'name' });
    expect((cellData[1] as Record<number, Record<string, unknown>>)[1]).toMatchObject({ v: 5 });
    expect((cellData[2] as Record<number, Record<string, unknown>>)[0]).toMatchObject({ v: 'pear' });
  });

  it('save writes to the path passed in (not the original open path)', async () => {
    const opened = await openExcel(xlsxPath);
    const otherPath = join(dir, 'copy.xlsx');
    await saveExcel(otherPath, opened.snapshot);
    // Must be readable from the new path
    const reopened = await openExcel(otherPath);
    expect(reopened.kind).toBe('excel');
  });
});
