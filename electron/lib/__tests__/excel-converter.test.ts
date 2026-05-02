import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { workbookToUniverSnapshot } from '../excel-converter';

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
