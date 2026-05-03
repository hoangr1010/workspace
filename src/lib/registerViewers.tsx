// Bootstrap: populates fileRegistry at app startup. Imported once as a
// side-effect in main.tsx. Add new file types here (PLAN 1.7 .docx, 4.3 .pptx).

import type { ComponentType } from 'react';
import { fileRegistry } from './fileRegistry';
import { ExcelViewer } from '../components/ViewerArea/ExcelViewer';
import { WordViewer } from '../components/ViewerArea/WordViewer';
import type { FileData, ExcelFileData, WordFileData } from '../types/file';
import { getSnapshot } from './excelLiveSnapshot';
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

// .docx — open via IPC, renderer mounts SuperDoc. Save lands in PLAN 1.9.
fileRegistry['.docx'] = {
  open: (filePath) => window.api.openWord(filePath),
  save: (_filePath, _data) =>
    Promise.reject(new Error('PLAN 1.9 — saveWord not implemented yet')),
  Viewer: bridgeViewer<WordFileData>(WordViewer, 'word'),
};

// .xlsx — open via IPC, renderer mounts Univer. Save pulls the live snapshot
// the mounted ExcelViewer registered (its post-edit Univer state); falls back
// to the stale file-open snapshot only if no viewer is mounted for this path.
// markClean runs only on success — failures keep the dot on so the user knows.
fileRegistry['.xlsx'] = {
  open: (filePath) => window.api.openExcel(filePath),
  save: async (filePath, data) => {
    if (data.kind !== 'excel') throw new Error('kind mismatch');
    const live = getSnapshot(filePath) ?? (data as ExcelFileData).snapshot;
    await window.api.saveExcel(filePath, live);
    useWorkspaceStore.getState().markClean(filePath);
  },
  Viewer: bridgeViewer<ExcelFileData>(ExcelViewer, 'excel'),
};
