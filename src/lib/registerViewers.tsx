// Bootstrap: populates fileRegistry at app startup. Imported once as a
// side-effect in main.tsx. Add new file types here (PLAN 1.7 .docx, 4.3 .pptx).

import type { ComponentType } from 'react';
import { fileRegistry } from './fileRegistry';
import { ExcelViewer } from '../components/ViewerArea/ExcelViewer';
import type { FileData, ExcelFileData } from '../types/file';

/**
 * Wrap a kind-specific Viewer so it satisfies the registry's union-typed slot.
 * Renders the wrapped component when `data.kind === kind`, else nothing.
 *
 * @param Component  The narrow Viewer (e.g. accepts ExcelFileData).
 * @param kind       The discriminant value the wrapped Viewer expects.
 * @returns          A Viewer accepting the full FileData union.
 */
function bridgeViewer<T extends FileData>(
  Component: ComponentType<{ data: T; filePath: string }>,
  kind: T['kind'],
): ComponentType<{ data: FileData; filePath: string }> {
  return function ViewerBridge({ data, filePath }) {
    if (data.kind !== kind) return null;
    return <Component data={data as T} filePath={filePath} />;
  };
}

// .xlsx — open via IPC, renderer mounts Univer. Save lands in PLAN 1.8.
fileRegistry['.xlsx'] = {
  open: (filePath) => window.api.openExcel(filePath),
  save: (filePath, data) => {
    if (data.kind !== 'excel') throw new Error('kind mismatch');
    return window.api.saveExcel(filePath, (data as ExcelFileData).snapshot);
  },
  Viewer: bridgeViewer<ExcelFileData>(ExcelViewer, 'excel'),
};
