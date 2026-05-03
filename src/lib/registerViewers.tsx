// Bootstrap: populates fileRegistry at app startup. Imported once as a
// side-effect in main.tsx. Add new file types here (PLAN 1.7 .docx, 4.3 .pptx).

import type { ComponentType } from 'react';
import { fileRegistry } from './fileRegistry';
import { ExcelViewer } from '../components/ViewerArea/ExcelViewer';
import { WordViewer } from '../components/ViewerArea/WordViewer';
import type { FileData, ExcelFileData, WordFileData } from '../types/file';
import { get as getWordExporter } from './wordSaveRegistry';
import { useWorkspaceStore } from '../store/workspaceStore';

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

// .docx — open via IPC, renderer mounts SuperDoc. The save path looks up the
// active SuperDoc instance's exporter (registered by WordViewer onReady),
// awaits the exported ArrayBuffer, ships it to main, then clears the dirty bit.
fileRegistry['.docx'] = {
  open: (filePath) => window.api.openWord(filePath),
  save: async (filePath, data) => {
    if (data.kind !== 'word') throw new Error('kind mismatch');
    const exporter = getWordExporter(filePath);
    if (!exporter) {
      throw new Error(`WordViewer not mounted for ${filePath}`);
    }
    const buffer = await exporter();
    await window.api.saveWord(filePath, buffer);
    useWorkspaceStore.getState().markClean(filePath);
  },
  Viewer: bridgeViewer<WordFileData>(WordViewer, 'word'),
};

// .xlsx — open via IPC, renderer mounts Univer. Save lands in PLAN 1.8.
fileRegistry['.xlsx'] = {
  open: (filePath) => window.api.openExcel(filePath),
  save: (filePath, data) => {
    if (data.kind !== 'excel') throw new Error('kind mismatch');
    return window.api.saveExcel(filePath, (data as ExcelFileData).snapshot);
  },
  Viewer: bridgeViewer<ExcelFileData>(ExcelViewer, 'excel'),
};
