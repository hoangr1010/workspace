// PLAN 1.6 — Pure conversion: SheetJS WorkBook → Univer snapshot (IWorkbookData shape).
// No file I/O here — that lives in electron/handlers/excel.handler.ts.
// See docs/architecture.md → "File type handling / Excel".

import * as XLSX from 'xlsx';

// Univer's CanvasColorService rejects bare hex strings ("D97757") and ARGB
// strings ("FFD97757") — it requires a CSS-compatible color string. Excel/SheetJS
// store colors as 6-char RGB or 8-char ARGB hex without a leading '#'. This
// helper normalizes them to '#RRGGBB' (alpha is dropped — Univer doesn't apply
// it on fills anyway, and partial-alpha would confuse the canvas painter).
function normalizeColor(rgb: string | undefined): string | undefined {
  if (!rgb) return undefined;
  const hex = rgb.startsWith('#') ? rgb.slice(1) : rgb;
  // ARGB → RGB (drop the leading alpha pair Excel writes)
  const rgbHex = hex.length === 8 ? hex.slice(2) : hex;
  if (rgbHex.length !== 6) return undefined;
  return `#${rgbHex.toUpperCase()}`;
}

// Map SheetJS cell style object → Univer IStyleData shape.
// SheetJS gives us: { font: { bold, italic, sz, color }, fill / patternType+fgColor, border, alignment }
// Univer expects:   { bl, it, ul, fs, ff, cl, bg, bd, ht, vt, tb, n }
// Note: SheetJS CE has a known limitation — it surfaces fill info on read but
// does not populate `font` or `border` on cell.s. That's why the architecture
// has a luckyexcel fallback path (docs/architecture.md → Alternative IO path).
function sheetJsStyleToUniver(s: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  // --- Font properties ---
  const font = s.font as Record<string, unknown> | undefined;
  if (font?.bold) out.bl = 1;
  if (font?.italic) out.it = 1;
  if (font?.underline) out.ul = { s: 1 };
  if (font?.sz) out.fs = font.sz;       // font size in points
  if (font?.name) out.ff = font.name;   // font family name
  const fontColor = normalizeColor((font?.color as Record<string, string> | undefined)?.rgb);
  if (fontColor) out.cl = { rgb: fontColor };

  // --- Background fill ---
  // SheetJS CE flattens fill into the top-level style object as `patternType` +
  // `fgColor` (rather than nesting under `fill`). Try the nested form first
  // for forward-compat with Pro readers, then fall back to the flat form.
  // Skip pure white: that's often Excel's default fill, not user intent.
  const fill = s.fill as Record<string, unknown> | undefined;
  const rawFg =
    (fill?.fgColor as Record<string, string> | undefined)?.rgb ??
    (s.patternType && s.patternType !== 'none'
      ? (s.fgColor as Record<string, string> | undefined)?.rgb
      : undefined);
  const fgColor = normalizeColor(rawFg);
  // Skip pure white — Excel writes that as the default fill and it'd just
  // override Univer's grid background unnecessarily.
  if (fgColor && fgColor !== '#FFFFFF') out.bg = { rgb: fgColor };

  // --- Text alignment ---
  const alignment = s.alignment as Record<string, unknown> | undefined;
  if (alignment?.horizontal === 'center') out.ht = 2;
  else if (alignment?.horizontal === 'right') out.ht = 3;
  if (alignment?.vertical === 'top') out.vt = 1;
  else if (alignment?.vertical === 'center') out.vt = 2;
  if (alignment?.wrapText) out.tb = 3;

  // --- Borders (top/bottom/left/right) ---
  // Map SheetJS border style names → Univer border style numbers
  const border = s.border as Record<string, unknown> | undefined;
  if (border) {
    const bd: Record<string, unknown> = {};
    const styleNum: Record<string, number> = { thin: 1, medium: 2, thick: 3, dashed: 11, dotted: 7 };
    // Use an explicit key map to avoid indexing into a string (noUncheckedIndexedAccess safe)
    const sideKeys = { top: 't', bottom: 'b', left: 'l', right: 'r' } as const;
    for (const side of ['top', 'bottom', 'left', 'right'] as const) {
      const b = border[side] as Record<string, unknown> | undefined;
      const n = styleNum[(b?.style as string) ?? ''];
      if (n) {
        const color = normalizeColor((b?.color as Record<string, string> | undefined)?.rgb) ?? '#000000';
        bd[sideKeys[side]] = { s: n, cl: { rgb: color } };
      }
    }
    if (Object.keys(bd).length) out.bd = bd;
  }

  // Number format is NOT included here — SheetJS surfaces it on the cell itself
  // as `cell.z`, separate from `cell.s`. The caller passes it via mergeNumFmt.
  return out;
}

// Combine the style object from sheetJsStyleToUniver with a number-format
// pattern (read from cell.z). Returns a fresh object so the dedup key stays
// stable when only the numFmt differs.
function mergeNumFmt(
  univerStyle: Record<string, unknown>,
  numFmt: string | undefined,
): Record<string, unknown> {
  if (!numFmt || numFmt === 'General') return univerStyle;
  return { ...univerStyle, n: { pattern: numFmt } };
}

export function workbookToUniverSnapshot(wb: XLSX.WorkBook): Record<string, unknown> {
  const sheets: Record<string, unknown> = {};
  const sheetOrder: string[] = [];

  // Deduplicate styles: identical styles get the same id, reducing snapshot size
  const stylesMap = new Map<string, string>(); // JSON-serialized style → assigned id
  const styles: Record<string, unknown> = {};
  let styleCounter = 0;

  function getStyleId(s: Record<string, unknown> | undefined, numFmt: string | undefined): string {
    const univerStyle = mergeNumFmt(s ? sheetJsStyleToUniver(s) : {}, numFmt);
    if (Object.keys(univerStyle).length === 0) return '';
    const key = JSON.stringify(univerStyle);
    if (!stylesMap.has(key)) {
      const id = `s${styleCounter++}`;
      stylesMap.set(key, id);
      styles[id] = univerStyle;
    }
    return stylesMap.get(key)!;
  }

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue; // guard: noUncheckedIndexedAccess makes Sheets[key] potentially undefined

    const sheetId = `sheet_${sheetOrder.length}`;
    sheetOrder.push(sheetId);

    // --- Cell data: iterate every cell in the used range ---
    const cellData: Record<number, Record<number, Record<string, unknown>>> = {};
    if (ws['!ref']) {
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let r = range.s.r; r <= range.e.r; r++) {
        for (let c = range.s.c; c <= range.e.c; c++) {
          const cell = ws[XLSX.utils.encode_cell({ r, c })];
          if (!cell || (cell.v === undefined && !cell.f)) continue;

          // Ensure the row bucket exists, then write into it via a local reference
          // so TypeScript knows it's non-undefined after the assignment
          if (!cellData[r]) cellData[r] = {};
          const rowBucket = cellData[r] as Record<number, Record<string, unknown>>;

          const out: Record<string, unknown> = {};
          // For formula cells, omit `v` so Univer's formula engine recomputes
          // on load instead of displaying the writer's stale cached result
          // (exceljs writes `v: 0` for unevaluated formulas, which would
          // otherwise show as 0/0% in the grid).
          if (cell.f) {
            const f = cell.f as string;
            out.f = f.startsWith('=') ? f : `=${f}`;
          } else if (cell.v !== undefined) {
            out.v = cell.v;
          }

          // Map SheetJS type char → Univer CellValueType number
          switch (cell.t) {
            case 'n':
            case 'd': out.t = 2; break; // number / date
            case 's':
            case 'str': out.t = 1; break; // string
            case 'b': out.t = 4; break;   // boolean
            // 'z' = blank stub. SheetJS uses this for formula-only cells whose
            // value isn't cached. If a formula is present, treat the result as
            // numeric so Univer's engine can compute and display it.
            case 'z': if (cell.f) out.t = 2; break;
          }

          // Attach style id whenever the cell has style data OR a number format.
          // SheetJS stores numFmt at cell.z, not cell.s — both contribute to the
          // final Univer style entry.
          const cellStyle = cell.s && typeof cell.s === 'object' ? (cell.s as Record<string, unknown>) : undefined;
          const numFmt = typeof cell.z === 'string' ? cell.z : undefined;
          if (cellStyle || numFmt) {
            const sid = getStyleId(cellStyle, numFmt);
            if (sid) out.s = sid;
          }
          rowBucket[c] = out;
        }
      }
    }

    // --- Merged cells ---
    const mergeData = (ws['!merges'] ?? []).map((m) => ({
      startRow: m.s.r,
      startColumn: m.s.c,
      endRow: m.e.r,
      endColumn: m.e.c,
    }));

    // --- Column widths (wpx = width in screen pixels) ---
    const columnData: Record<number, { w: number }> = {};
    const cols = ws['!cols'];
    if (cols) {
      for (let ci = 0; ci < cols.length; ci++) {
        const col = cols[ci];
        if (col?.wpx) columnData[ci] = { w: col.wpx };
      }
    }

    // --- Row heights (hpx = height in screen pixels) ---
    const rowData: Record<number, { h: number }> = {};
    const rows = ws['!rows'];
    if (rows) {
      for (let ri = 0; ri < rows.length; ri++) {
        const row = rows[ri];
        if (row?.hpx) rowData[ri] = { h: row.hpx };
      }
    }

    // Pad row/col counts beyond the data so the grid doesn't feel cramped
    const range = ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']) : null;
    sheets[sheetId] = {
      id: sheetId,
      name: sheetName,
      tabColor: '',
      hidden: 0,
      rowCount: range ? range.e.r + 1 + 100 : 1000,
      columnCount: range ? range.e.c + 1 + 10 : 26,
      defaultColumnWidth: 93,
      defaultRowHeight: 27,
      // Initial document zoom — grid renders denser without scaling the chrome
      // (which would break canvas pointer math). User can adjust via the bottom
      // zoom slider; Univer writes back to this same field.
      zoomRatio: 0.85,
      cellData,
      mergeData,
      columnData,
      rowData,
      showGridlines: 1,
    };
  }

  return {
    id: 'workbook_1',
    name: (wb.Props?.Title as string | undefined) ?? 'Workbook',
    sheetOrder,
    sheets,
    styles, // shared style dictionary: cells reference entries here by id
    locale: 'enUS',
    resources: [],
  };
}

// Inverse of normalizeColor — Univer stores '#RRGGBB', SheetJS wants 'RRGGBB' (no #).
function denormalizeColor(rgb: string | undefined): string | undefined {
  if (!rgb) return undefined;
  const hex = rgb.startsWith('#') ? rgb.slice(1) : rgb;
  return hex.length === 6 ? hex.toUpperCase() : undefined;
}

// Inverse of sheetJsStyleToUniver. Number format lives at cell.z in SheetJS
// (not inside cell.s), so it's returned alongside.
function univerStyleToSheetJs(univer: Record<string, unknown>): {
  style: Record<string, unknown> | undefined;
  numFmt: string | undefined;
} {
  const out: Record<string, unknown> = {};

  // --- Font properties ---
  const font: Record<string, unknown> = {};
  if (univer.bl) font.bold = true;
  if (univer.it) font.italic = true;
  if (univer.ul) font.underline = true;
  if (typeof univer.fs === 'number') font.sz = univer.fs;
  if (typeof univer.ff === 'string') font.name = univer.ff;
  const fontColor = denormalizeColor((univer.cl as Record<string, string> | undefined)?.rgb);
  if (fontColor) font.color = { rgb: fontColor };
  if (Object.keys(font).length) out.font = font;

  // --- Background fill ---
  const bgColor = denormalizeColor((univer.bg as Record<string, string> | undefined)?.rgb);
  if (bgColor) out.fill = { fgColor: { rgb: bgColor }, patternType: 'solid' };

  // --- Text alignment ---
  const alignment: Record<string, unknown> = {};
  if (univer.ht === 2) alignment.horizontal = 'center';
  else if (univer.ht === 3) alignment.horizontal = 'right';
  if (univer.vt === 1) alignment.vertical = 'top';
  else if (univer.vt === 2) alignment.vertical = 'center';
  if (univer.tb === 3) alignment.wrapText = true;
  if (Object.keys(alignment).length) out.alignment = alignment;

  // --- Borders ---
  const bd = univer.bd as Record<string, Record<string, unknown>> | undefined;
  if (bd) {
    const styleName: Record<number, string> = { 1: 'thin', 2: 'medium', 3: 'thick', 7: 'dotted', 11: 'dashed' };
    const sideKeys = { t: 'top', b: 'bottom', l: 'left', r: 'right' } as const;
    const border: Record<string, unknown> = {};
    for (const side of ['t', 'b', 'l', 'r'] as const) {
      const b = bd[side];
      if (!b) continue;
      const name = styleName[b.s as number];
      if (!name) continue;
      const color = denormalizeColor((b.cl as Record<string, string> | undefined)?.rgb);
      border[sideKeys[side]] = color ? { style: name, color: { rgb: color } } : { style: name };
    }
    if (Object.keys(border).length) out.border = border;
  }

  // Number format is surfaced at cell.z, not nested in cell.s.
  const numFmtPattern = (univer.n as Record<string, unknown> | undefined)?.pattern;
  const numFmt = typeof numFmtPattern === 'string' ? numFmtPattern : undefined;

  return {
    style: Object.keys(out).length ? out : undefined,
    numFmt,
  };
}

// PLAN 1.8 — Pure conversion: Univer snapshot → SheetJS WorkBook. Inverse of
// workbookToUniverSnapshot. Trims the used range to actual data (rowCount/
// columnCount in the snapshot are padded for grid feel). Univer-only fields
// (tabColor, hidden, zoomRatio, showGridlines) are dropped silently — SheetJS
// CE can't represent them.
export function univerSnapshotToWorkbook(snapshot: Record<string, unknown>): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const sheetOrder = (snapshot.sheetOrder ?? []) as string[];
  const sheets = (snapshot.sheets ?? {}) as Record<string, Record<string, unknown>>;
  const styles = (snapshot.styles ?? {}) as Record<string, Record<string, unknown>>;

  for (const sheetId of sheetOrder) {
    const sheet = sheets[sheetId];
    if (!sheet) continue;

    const sheetName = (sheet.name as string | undefined) ?? sheetId;
    const cellData = (sheet.cellData ?? {}) as Record<string | number, Record<string | number, Record<string, unknown>>>;

    // --- Cell data: walk cellData and track actual used range for !ref ---
    let minR = Infinity, maxR = -1, minC = Infinity, maxC = -1;
    const ws: XLSX.WorkSheet = {};

    for (const rKey of Object.keys(cellData)) {
      const r = Number(rKey);
      const row = cellData[rKey];
      if (!row) continue;
      for (const cKey of Object.keys(row)) {
        const c = Number(cKey);
        const uCell = row[cKey];
        if (!uCell) continue;

        // Map Univer cell type 1/2/4 → SheetJS 's'/'n'/'b'. Default 's' keeps
        // CellObject.t populated (it's required) for cells without an explicit type.
        let t: XLSX.ExcelDataType = 's';
        switch (uCell.t) {
          case 1: t = 's'; break;
          case 2: t = 'n'; break;
          case 4: t = 'b'; break;
        }
        const cell: XLSX.CellObject = { t };

        // SheetJS stores formulas without the leading '='
        if (typeof uCell.f === 'string') {
          const f = uCell.f;
          cell.f = f.startsWith('=') ? f.slice(1) : f;
        }
        if (uCell.v !== undefined) {
          cell.v = uCell.v as Exclude<XLSX.CellObject['v'], undefined>;
        }

        // Style + number format come from the shared styles dict
        if (typeof uCell.s === 'string' && styles[uCell.s]) {
          const { style, numFmt } = univerStyleToSheetJs(styles[uCell.s] as Record<string, unknown>);
          if (style) cell.s = style;
          if (numFmt) cell.z = numFmt;
        }

        if (cell.v === undefined && !cell.f) continue;

        ws[XLSX.utils.encode_cell({ r, c })] = cell;
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }

    if (maxR >= 0) {
      ws['!ref'] = XLSX.utils.encode_range({ s: { r: minR, c: minC }, e: { r: maxR, c: maxC } });
    }

    // --- Merged cells ---
    const mergeData = (sheet.mergeData ?? []) as Array<{ startRow: number; startColumn: number; endRow: number; endColumn: number }>;
    if (mergeData.length) {
      ws['!merges'] = mergeData.map((m) => ({
        s: { r: m.startRow, c: m.startColumn },
        e: { r: m.endRow, c: m.endColumn },
      }));
    }

    // --- Column widths (wpx = width in screen pixels) ---
    const columnData = (sheet.columnData ?? {}) as Record<string | number, { w: number } | undefined>;
    const colKeys = Object.keys(columnData).map(Number);
    if (colKeys.length) {
      const cols: XLSX.ColInfo[] = [];
      for (const ci of colKeys) {
        const col = columnData[ci];
        if (col?.w !== undefined) cols[ci] = { wpx: col.w };
      }
      ws['!cols'] = cols;
    }

    // --- Row heights (hpx = height in screen pixels) ---
    const rowData = (sheet.rowData ?? {}) as Record<string | number, { h: number } | undefined>;
    const rowKeys = Object.keys(rowData).map(Number);
    if (rowKeys.length) {
      const rows: XLSX.RowInfo[] = [];
      for (const ri of rowKeys) {
        const row = rowData[ri];
        if (row?.h !== undefined) rows[ri] = { hpx: row.h };
      }
      ws['!rows'] = rows;
    }

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  return wb;
}
