// PLAN 1.6 / 1.7 / 4.3 — File registry
// Maps a FileExt to its open/save IPC calls and Viewer component.
// See docs/architecture.md → "File registry pattern".

import type { ComponentType } from 'react';
import type { FileExt, FileData } from '../types/file';
import { WordViewer } from '../components/ViewerArea/WordViewer';

export interface FileHandler<T extends FileData> {
  readonly open: (filePath: string) => Promise<T>;
  readonly save: (filePath: string, data: T) => Promise<void>;
  readonly Viewer: ComponentType<{ data: T; filePath: string }>;
}

// Populate per task: 1.6 (.xlsx), 1.7 (.docx), 4.3 (.pptx).
export const fileRegistry: Partial<Record<FileExt, FileHandler<FileData>>> = {
  '.docx': {
    open: (filePath) => window.api.openWord(filePath),
    save: (_filePath, _data) => {
      // PLAN 1.9 — wire SuperDoc export → window.api.saveWord.
      return Promise.reject(new Error('PLAN 1.9 — saveWord not implemented yet'));
    },
    Viewer: WordViewer,
  },
};
