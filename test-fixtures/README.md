# test-fixtures

Binary `.xlsx` files used for **manual** verification of the Excel viewer
(PLAN 1.6) — open these in the Electron app to eyeball Univer's rendering of
real-world styles, formulas, and merged cells.

## Files

- `styled-workbook/styled-report.xlsx` — exercises fills, currency / percent
  number formats, SUM and ratio formulas, merged title cell, multi-sheet tabs.
  Used while implementing 1.6 to surface the canvas-color crash, the `cell.z`
  numFmt source, and the formula recompute behavior.

## Regenerating

These are committed as binary artifacts. There is no build script in the repo
because no automated test consumes them — the regression coverage lives in
[`electron/lib/__tests__/excel-converter.test.ts`](../electron/lib/__tests__/excel-converter.test.ts)
using in-memory SheetJS workbooks.

If you need to extend a fixture (add new styles, new sheets, etc.), install
[`exceljs`](https://www.npmjs.com/package/exceljs) as a dev dep, write a small
generator, and commit the new `.xlsx`.
