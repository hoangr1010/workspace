import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { workbookToUniverSnapshot, univerSnapshotToWorkbook } from '../excel-converter';

// Helper: build a minimal SheetJS workbook from a map of cell refs → cell objects
function makeWorkbook(sheets: Record<string, Record<string, XLSX.CellObject>>): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  for (const [name, cells] of Object.entries(sheets)) {
    const ws: XLSX.WorkSheet = { ...cells };
    if (Object.keys(cells).length > 0) {
      const rows = Object.keys(cells).map((k) => XLSX.utils.decode_cell(k).r);
      const cols = Object.keys(cells).map((k) => XLSX.utils.decode_cell(k).c);
      ws['!ref'] = XLSX.utils.encode_range({
        s: { r: Math.min(...rows), c: Math.min(...cols) },
        e: { r: Math.max(...rows), c: Math.max(...cols) },
      });
    }
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  return wb;
}

// Helper: get cellData from the first sheet in the snapshot
function firstSheetCellData(snap: Record<string, unknown>): Record<number, Record<number, Record<string, unknown>>> {
  const sheets = snap.sheets as Record<string, Record<string, unknown>>;
  const sheetOrder = snap.sheetOrder as string[];
  const firstId = sheetOrder[0] as string;
  const sheet = sheets[firstId] as Record<string, unknown>;
  return sheet.cellData as Record<number, Record<number, Record<string, unknown>>>;
}

// Helper: read a cell safely (noUncheckedIndexedAccess makes [r][c] possibly undefined)
function getCell(cellData: Record<number, Record<number, Record<string, unknown>>>, r: number, c: number): Record<string, unknown> | undefined {
  return (cellData[r] as Record<number, Record<string, unknown>> | undefined)?.[c];
}

// ─── Core shape ────────────────────────────────────────────────────────────────

describe('workbookToUniverSnapshot — core shape', () => {
  it('returns object with required top-level keys', () => {
    const wb = makeWorkbook({ Sheet1: {} });
    const snap = workbookToUniverSnapshot(wb);
    expect(snap).toHaveProperty('id');
    expect(snap).toHaveProperty('name');
    expect(snap).toHaveProperty('sheetOrder');
    expect(snap).toHaveProperty('sheets');
    expect(snap).toHaveProperty('styles');
    expect(snap).toHaveProperty('locale');
    expect(snap).toHaveProperty('resources');
  });

  it('single sheet — sheetOrder has 1 entry, sheets has 1 entry', () => {
    const wb = makeWorkbook({ MySheet: {} });
    const snap = workbookToUniverSnapshot(wb);
    expect((snap.sheetOrder as string[]).length).toBe(1);
    expect(Object.keys(snap.sheets as object).length).toBe(1);
  });

  it('sheet name matches wb.SheetNames[0]', () => {
    const wb = makeWorkbook({ 'Q4 Budget': {} });
    const snap = workbookToUniverSnapshot(wb);
    const sheets = snap.sheets as Record<string, Record<string, unknown>>;
    const firstId = (snap.sheetOrder as string[])[0] as string;
    const firstSheet = sheets[firstId] as Record<string, unknown>;
    expect(firstSheet.name).toBe('Q4 Budget');
  });

  it('multi-sheet — sheetOrder has 3 entries in correct order', () => {
    const wb = makeWorkbook({ Alpha: {}, Beta: {}, Gamma: {} });
    const snap = workbookToUniverSnapshot(wb);
    const sheetOrder = snap.sheetOrder as string[];
    expect(sheetOrder.length).toBe(3);
    const sheets = snap.sheets as Record<string, Record<string, unknown>>;
    expect((sheets[sheetOrder[0] as string] as Record<string, unknown>).name).toBe('Alpha');
    expect((sheets[sheetOrder[1] as string] as Record<string, unknown>).name).toBe('Beta');
    expect((sheets[sheetOrder[2] as string] as Record<string, unknown>).name).toBe('Gamma');
  });
});

// ─── Cell values ───────────────────────────────────────────────────────────────

describe('workbookToUniverSnapshot — cell values', () => {
  it('number cell at A1 maps to {v:42, t:2}', () => {
    const wb = makeWorkbook({ Sheet1: { A1: { t: 'n', v: 42 } } });
    const snap = workbookToUniverSnapshot(wb);
    expect(getCell(firstSheetCellData(snap), 0, 0)).toMatchObject({ v: 42, t: 2 });
  });

  it('string cell at B2 maps to {v:"hello", t:1}', () => {
    const wb = makeWorkbook({ Sheet1: { B2: { t: 's', v: 'hello' } } });
    const snap = workbookToUniverSnapshot(wb);
    expect(getCell(firstSheetCellData(snap), 1, 1)).toMatchObject({ v: 'hello', t: 1 });
  });

  it('boolean cell at C1 maps to {v:true, t:4}', () => {
    const wb = makeWorkbook({ Sheet1: { C1: { t: 'b', v: true } } });
    const snap = workbookToUniverSnapshot(wb);
    expect(getCell(firstSheetCellData(snap), 0, 2)).toMatchObject({ v: true, t: 4 });
  });

  it('formula cell prepends = and omits cached v so Univer recomputes', () => {
    // SheetJS strips the leading '=' on read; Univer's formula engine requires it.
    // We also drop `v` for formula cells — exceljs writes a stale `v: 0` and
    // Univer would display that instead of recomputing the formula.
    const wb = makeWorkbook({ Sheet1: { A1: { t: 'n', v: 6, f: 'SUM(A1:A3)' } } });
    const snap = workbookToUniverSnapshot(wb);
    const cell = getCell(firstSheetCellData(snap), 0, 0)!;
    expect(cell).toHaveProperty('f', '=SUM(A1:A3)');
    expect(cell).not.toHaveProperty('v');
  });

  it("formula-only cell with SheetJS type 'z' becomes numeric", () => {
    // SheetJS uses type 'z' (blank stub) for cells that have a formula but no
    // cached value. Univer needs t=2 so the formula result renders as a number.
    const wb = makeWorkbook({ Sheet1: { A1: { t: 'z', v: 0, f: 'B1+C1' } } });
    const snap = workbookToUniverSnapshot(wb);
    expect(getCell(firstSheetCellData(snap), 0, 0)).toMatchObject({ t: 2, f: '=B1+C1' });
  });

  it('cell-level number format from cell.z is captured into style', () => {
    // SheetJS surfaces the number format on cell.z (not cell.s.numFmt).
    const wb = makeWorkbook({ Sheet1: { A1: { t: 'n', v: 12500, z: '$#,##0' } } });
    const snap = workbookToUniverSnapshot(wb);
    const cell = getCell(firstSheetCellData(snap), 0, 0)!;
    expect(cell).toHaveProperty('s');
    const styles = snap.styles as Record<string, Record<string, unknown>>;
    expect(styles[cell.s as string]).toMatchObject({ n: { pattern: '$#,##0' } });
  });
});

// ─── Edge cases ────────────────────────────────────────────────────────────────

describe('workbookToUniverSnapshot — edge cases', () => {
  it('empty sheet (no !ref) produces empty cellData', () => {
    const wb = makeWorkbook({ Sheet1: {} });
    const snap = workbookToUniverSnapshot(wb);
    expect(Object.keys(firstSheetCellData(snap)).length).toBe(0);
  });

  it('Z1 maps to cellData[0][25]', () => {
    const wb = makeWorkbook({ Sheet1: { Z1: { t: 'n', v: 99 } } });
    const snap = workbookToUniverSnapshot(wb);
    expect(getCell(firstSheetCellData(snap), 0, 25)).toMatchObject({ v: 99 });
  });

  it('A2 maps to cellData[1][0]', () => {
    const wb = makeWorkbook({ Sheet1: { A2: { t: 's', v: 'row2' } } });
    const snap = workbookToUniverSnapshot(wb);
    expect(getCell(firstSheetCellData(snap), 1, 0)).toMatchObject({ v: 'row2' });
  });
});

// ─── Styles ────────────────────────────────────────────────────────────────────

describe('workbookToUniverSnapshot — styles', () => {
  it('bold cell produces a style with bl:1 and cell references it via s key', () => {
    const wb = makeWorkbook({
      Sheet1: {
        A1: { t: 's', v: 'Bold', s: { font: { bold: true } } as unknown as number },
      },
    });
    const snap = workbookToUniverSnapshot(wb);
    const cellData = firstSheetCellData(snap);
    const styles = snap.styles as Record<string, unknown>;
    const cell = getCell(cellData, 0, 0);
    const styleId = cell?.s as string | undefined;
    expect(styleId).toBeTruthy();
    if (styleId) expect(styles[styleId]).toMatchObject({ bl: 1 });
  });

  it('background color fgColor.rgb maps to bg:{rgb:"FFFF00"} in style', () => {
    const wb = makeWorkbook({
      Sheet1: {
        A1: {
          t: 's',
          v: 'Yellow',
          s: { fill: { fgColor: { rgb: 'FFFF00' } } } as unknown as number,
        },
      },
    });
    const snap = workbookToUniverSnapshot(wb);
    const styles = snap.styles as Record<string, unknown>;
    const cell = getCell(firstSheetCellData(snap), 0, 0);
    const styleId = cell?.s as string | undefined;
    // Univer's canvas painter requires '#'-prefixed CSS color strings; bare hex throws.
    if (styleId) expect(styles[styleId]).toMatchObject({ bg: { rgb: '#FFFF00' } });
  });

  it('ARGB color strings drop the alpha channel and gain # prefix', () => {
    // Excel/exceljs writes colors as ARGB (e.g. "FFD97757"). Univer wants "#D97757".
    const wb = makeWorkbook({
      Sheet1: {
        A1: { t: 's', v: 'Clay', s: { fill: { fgColor: { rgb: 'FFD97757' } } } as unknown as number },
      },
    });
    const snap = workbookToUniverSnapshot(wb);
    const styles = snap.styles as Record<string, Record<string, unknown>>;
    const cell = getCell(firstSheetCellData(snap), 0, 0)!;
    expect(styles[cell.s as string]).toMatchObject({ bg: { rgb: '#D97757' } });
  });

  it('two cells with identical styles produce only one style entry', () => {
    const sharedStyle = { font: { bold: true } };
    const wb = makeWorkbook({
      Sheet1: {
        A1: { t: 's', v: 'Bold1', s: sharedStyle as unknown as number },
        B1: { t: 's', v: 'Bold2', s: sharedStyle as unknown as number },
      },
    });
    const snap = workbookToUniverSnapshot(wb);
    expect(Object.keys(snap.styles as object).length).toBe(1);
  });
});

// ─── Layout ────────────────────────────────────────────────────────────────────

describe('workbookToUniverSnapshot — layout', () => {
  it('column width wpx:150 maps to columnData[0].w = 150', () => {
    const wb = makeWorkbook({ Sheet1: { A1: { t: 'n', v: 1 } } });
    wb.Sheets['Sheet1']!['!cols'] = [{ wpx: 150 }];
    const snap = workbookToUniverSnapshot(wb);
    const sheets = snap.sheets as Record<string, Record<string, unknown>>;
    const firstId = (snap.sheetOrder as string[])[0] as string;
    const sheet = sheets[firstId] as Record<string, unknown>;
    const columnData = sheet.columnData as Record<number, { w: number }>;
    expect((columnData[0] as { w: number } | undefined)?.w).toBe(150);
  });

  it('merged cell produces correct mergeData entry', () => {
    const wb = makeWorkbook({ Sheet1: { A1: { t: 'n', v: 1 } } });
    wb.Sheets['Sheet1']!['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
    const snap = workbookToUniverSnapshot(wb);
    const sheets = snap.sheets as Record<string, Record<string, unknown>>;
    const firstId = (snap.sheetOrder as string[])[0] as string;
    const sheet = sheets[firstId] as Record<string, unknown>;
    const mergeData = sheet.mergeData as unknown[];
    expect(mergeData[0]).toMatchObject({ startRow: 0, startColumn: 0, endRow: 0, endColumn: 2 });
  });
});

// ─── Inverse: univerSnapshotToWorkbook ─────────────────────────────────────────
//
// Tests the reverse direction used at save time. Each test builds a Univer
// snapshot by hand (the "after-edit" state) and verifies the produced
// SheetJS WorkBook has the shape XLSX.write expects.

// Helper: build a minimal Univer snapshot from the parts that actually vary
// per test. Defaults match what workbookToUniverSnapshot would emit for an
// empty single-sheet workbook.
function makeSnapshot(opts: {
  sheetName?: string;
  cellData?: Record<number, Record<number, Record<string, unknown>>>;
  styles?: Record<string, Record<string, unknown>>;
  mergeData?: Array<{ startRow: number; startColumn: number; endRow: number; endColumn: number }>;
  columnData?: Record<number, { w: number }>;
  rowData?: Record<number, { h: number }>;
  rowCount?: number;
  columnCount?: number;
  extraSheetFields?: Record<string, unknown>;
}): Record<string, unknown> {
  const sheetId = 'sheet_0';
  return {
    id: 'workbook_1',
    name: 'Workbook',
    sheetOrder: [sheetId],
    sheets: {
      [sheetId]: {
        id: sheetId,
        name: opts.sheetName ?? 'Sheet1',
        cellData: opts.cellData ?? {},
        mergeData: opts.mergeData ?? [],
        columnData: opts.columnData ?? {},
        rowData: opts.rowData ?? {},
        rowCount: opts.rowCount ?? 100,
        columnCount: opts.columnCount ?? 26,
        ...(opts.extraSheetFields ?? {}),
      },
    },
    styles: opts.styles ?? {},
    locale: 'enUS',
    resources: [],
  };
}

describe('univerSnapshotToWorkbook — core shape', () => {
  it('minimal snapshot returns a WorkBook with one sheet', () => {
    const snap = makeSnapshot({});
    const wb = univerSnapshotToWorkbook(snap);
    expect(wb.SheetNames.length).toBe(1);
    expect(wb.SheetNames[0]).toBe('Sheet1');
    expect(wb.Sheets['Sheet1']).toBeDefined();
  });

  it('three-sheet snapshot preserves sheet order and names', () => {
    const snap = {
      id: 'workbook_1',
      name: 'Workbook',
      sheetOrder: ['s_a', 's_b', 's_c'],
      sheets: {
        s_a: { id: 's_a', name: 'Alpha', cellData: {}, mergeData: [], columnData: {}, rowData: {}, rowCount: 10, columnCount: 5 },
        s_b: { id: 's_b', name: 'Beta',  cellData: {}, mergeData: [], columnData: {}, rowData: {}, rowCount: 10, columnCount: 5 },
        s_c: { id: 's_c', name: 'Gamma', cellData: {}, mergeData: [], columnData: {}, rowData: {}, rowCount: 10, columnCount: 5 },
      },
      styles: {},
      locale: 'enUS',
      resources: [],
    };
    const wb = univerSnapshotToWorkbook(snap);
    expect(wb.SheetNames).toEqual(['Alpha', 'Beta', 'Gamma']);
  });
});

describe('univerSnapshotToWorkbook — cell values', () => {
  it('number cell {v:42, t:2} maps to A1 with t:"n", v:42', () => {
    const snap = makeSnapshot({ cellData: { 0: { 0: { v: 42, t: 2 } } } });
    const ws = univerSnapshotToWorkbook(snap).Sheets['Sheet1']!;
    expect(ws['A1']).toMatchObject({ t: 'n', v: 42 });
  });

  it('string cell {v:"hello", t:1} maps to A1 with t:"s"', () => {
    const snap = makeSnapshot({ cellData: { 0: { 0: { v: 'hello', t: 1 } } } });
    const ws = univerSnapshotToWorkbook(snap).Sheets['Sheet1']!;
    expect(ws['A1']).toMatchObject({ t: 's', v: 'hello' });
  });

  it('boolean cell {v:true, t:4} maps to A1 with t:"b", v:true', () => {
    const snap = makeSnapshot({ cellData: { 0: { 0: { v: true, t: 4 } } } });
    const ws = univerSnapshotToWorkbook(snap).Sheets['Sheet1']!;
    expect(ws['A1']).toMatchObject({ t: 'b', v: true });
  });

  it('formula cell strips leading "=" (SheetJS stores formulas without it)', () => {
    const snap = makeSnapshot({ cellData: { 0: { 0: { f: '=SUM(A1:A3)' } } } });
    const ws = univerSnapshotToWorkbook(snap).Sheets['Sheet1']!;
    expect(ws['A1']).toMatchObject({ f: 'SUM(A1:A3)' });
  });

  it('formula cell already without leading "=" is preserved as-is', () => {
    const snap = makeSnapshot({ cellData: { 0: { 0: { f: 'B1+C1' } } } });
    const ws = univerSnapshotToWorkbook(snap).Sheets['Sheet1']!;
    expect(ws['A1']?.f).toBe('B1+C1');
  });
});

describe('univerSnapshotToWorkbook — styles', () => {
  it('style with bl:1 produces font.bold:true on referencing cell', () => {
    const snap = makeSnapshot({
      cellData: { 0: { 0: { v: 'X', t: 1, s: 's0' } } },
      styles: { s0: { bl: 1 } },
    });
    const ws = univerSnapshotToWorkbook(snap).Sheets['Sheet1']!;
    const cellStyle = ws['A1']?.s as Record<string, unknown> | undefined;
    expect((cellStyle?.font as Record<string, unknown> | undefined)?.bold).toBe(true);
  });

  it('background color bg.rgb "#FFFF00" maps to fill.fgColor.rgb "FFFF00" (no #)', () => {
    const snap = makeSnapshot({
      cellData: { 0: { 0: { v: 'X', t: 1, s: 's0' } } },
      styles: { s0: { bg: { rgb: '#FFFF00' } } },
    });
    const ws = univerSnapshotToWorkbook(snap).Sheets['Sheet1']!;
    const cellStyle = ws['A1']?.s as Record<string, unknown> | undefined;
    const fill = cellStyle?.fill as Record<string, unknown> | undefined;
    const fgColor = fill?.fgColor as Record<string, unknown> | undefined;
    expect(fgColor?.rgb).toBe('FFFF00');
  });

  it('number-format style {n:{pattern:"$#,##0"}} sets cell.z, not cell.s', () => {
    const snap = makeSnapshot({
      cellData: { 0: { 0: { v: 12500, t: 2, s: 's0' } } },
      styles: { s0: { n: { pattern: '$#,##0' } } },
    });
    const ws = univerSnapshotToWorkbook(snap).Sheets['Sheet1']!;
    expect(ws['A1']?.z).toBe('$#,##0');
  });

  it('combined style {bl:1, n:{pattern:...}} writes both font.bold AND cell.z', () => {
    const snap = makeSnapshot({
      cellData: { 0: { 0: { v: 100, t: 2, s: 's0' } } },
      styles: { s0: { bl: 1, n: { pattern: '0.00' } } },
    });
    const ws = univerSnapshotToWorkbook(snap).Sheets['Sheet1']!;
    expect(ws['A1']?.z).toBe('0.00');
    const cellStyle = ws['A1']?.s as Record<string, unknown> | undefined;
    expect((cellStyle?.font as Record<string, unknown> | undefined)?.bold).toBe(true);
  });
});

describe('univerSnapshotToWorkbook — layout', () => {
  it('mergeData entry maps to ws["!merges"] entry with correct r/c bounds', () => {
    const snap = makeSnapshot({
      cellData: { 0: { 0: { v: 'merged', t: 1 } } },
      mergeData: [{ startRow: 0, startColumn: 0, endRow: 0, endColumn: 2 }],
    });
    const ws = univerSnapshotToWorkbook(snap).Sheets['Sheet1']!;
    expect(ws['!merges']?.[0]).toMatchObject({ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } });
  });

  it('columnData[0]:{w:150} maps to ws["!cols"][0].wpx === 150', () => {
    const snap = makeSnapshot({
      cellData: { 0: { 0: { v: 1, t: 2 } } },
      columnData: { 0: { w: 150 } },
    });
    const ws = univerSnapshotToWorkbook(snap).Sheets['Sheet1']!;
    expect(ws['!cols']?.[0]?.wpx).toBe(150);
  });

  it('rowData[0]:{h:30} maps to ws["!rows"][0].hpx === 30', () => {
    const snap = makeSnapshot({
      cellData: { 0: { 0: { v: 1, t: 2 } } },
      rowData: { 0: { h: 30 } },
    });
    const ws = univerSnapshotToWorkbook(snap).Sheets['Sheet1']!;
    expect(ws['!rows']?.[0]?.hpx).toBe(30);
  });

  it('used-range trim: rowCount:200, columnCount:30 with only A1 → !ref bounds are A1', () => {
    // Critical: without trimming, every save would bloat the file by padding
    // every cell out to the full sheet bounds.
    // SheetJS's encode_range canonically emits 'A1' (no ':A1') for single-cell
    // ranges, so we assert on decoded bounds rather than the literal string.
    const snap = makeSnapshot({
      cellData: { 0: { 0: { v: 'only', t: 1 } } },
      rowCount: 200,
      columnCount: 30,
    });
    const ws = univerSnapshotToWorkbook(snap).Sheets['Sheet1']!;
    expect(ws['!ref']).toBeDefined();
    const range = XLSX.utils.decode_range(ws['!ref']!);
    expect(range.e.r).toBe(0);
    expect(range.e.c).toBe(0);
  });
});

describe('univerSnapshotToWorkbook — edge cases', () => {
  it('empty sheet (no cellData) does not throw and yields an empty/undefined !ref', () => {
    const snap = makeSnapshot({});
    const wb = univerSnapshotToWorkbook(snap);
    const ws = wb.Sheets['Sheet1']!;
    // Either undefined or no actual cells — both are fine; just must not throw.
    if (ws['!ref']) {
      const range = XLSX.utils.decode_range(ws['!ref']);
      // No cells should exist in the range
      for (let r = range.s.r; r <= range.e.r; r++) {
        for (let c = range.s.c; c <= range.e.c; c++) {
          expect(ws[XLSX.utils.encode_cell({ r, c })]).toBeUndefined();
        }
      }
    }
  });

  it('drops Univer-only fields (tabColor, hidden, zoomRatio, showGridlines) silently', () => {
    const snap = makeSnapshot({
      cellData: { 0: { 0: { v: 1, t: 2 } } },
      extraSheetFields: { tabColor: '#FF0000', hidden: 0, zoomRatio: 1.5, showGridlines: 1 },
    });
    expect(() => univerSnapshotToWorkbook(snap)).not.toThrow();
  });
});

// ─── Round-trip integration ────────────────────────────────────────────────────

describe('workbook ↔ snapshot round-trip', () => {
  it('forward → inverse preserves cell values, formulas, styles, merges, layout', () => {
    const original = makeWorkbook({
      Sheet1: {
        A1: { t: 's', v: 'Header', s: { font: { bold: true } } as unknown as number },
        A2: { t: 'n', v: 42 },
        B2: { t: 'n', v: 0, f: 'A2*2' },
        C1: { t: 's', v: 'Yellow', s: { fill: { fgColor: { rgb: 'FFFF00' } } } as unknown as number },
      },
    });
    original.Sheets['Sheet1']!['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    original.Sheets['Sheet1']!['!cols'] = [{ wpx: 150 }];

    const snap = workbookToUniverSnapshot(original);
    const restored = univerSnapshotToWorkbook(snap);

    expect(restored.SheetNames).toEqual(['Sheet1']);
    const ws = restored.Sheets['Sheet1']!;
    expect(ws['A1']).toMatchObject({ v: 'Header' });
    expect(ws['A2']).toMatchObject({ v: 42, t: 'n' });
    // Formula cell: leading '=' is stripped by both directions
    expect(ws['B2']?.f).toBe('A2*2');
    // C1 had a yellow fill; styles should round-trip
    expect(ws['C1']?.s).toBeDefined();
    expect(ws['!merges']?.[0]).toMatchObject({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } });
    expect(ws['!cols']?.[0]?.wpx).toBe(150);
  });

  it('two round-trips produce stable cellData (idempotent)', () => {
    const wb1 = makeWorkbook({ S1: { A1: { t: 'n', v: 7 } } });
    const snap1 = workbookToUniverSnapshot(wb1);
    const wb2 = univerSnapshotToWorkbook(snap1);
    const snap2 = workbookToUniverSnapshot(wb2);
    expect(snap2.sheetOrder).toEqual(snap1.sheetOrder);
    const sheets1 = snap1.sheets as Record<string, Record<string, unknown>>;
    const sheets2 = snap2.sheets as Record<string, Record<string, unknown>>;
    const id1 = (snap1.sheetOrder as string[])[0] as string;
    const id2 = (snap2.sheetOrder as string[])[0] as string;
    expect((sheets2[id2] as Record<string, unknown>).cellData)
      .toEqual((sheets1[id1] as Record<string, unknown>).cellData);
  });
});
