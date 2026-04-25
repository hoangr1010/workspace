// PLAN 1.6 / 1.7 / 4.3 — File registry
// Maps a FileExt to its open/save IPC calls and Viewer component.
// See docs/architecture.md → "File registry pattern".

import type { ComponentType } from 'react';
import type { FileExt, FileData } from '../types/file';

export interface FileHandler<T extends FileData> {
  readonly open: (filePath: string) => Promise<T>;
  readonly save: (filePath: string, data: T) => Promise<void>;
  readonly Viewer: ComponentType<{ data: T; filePath: string }>;
}

// Populate per task: 1.6 (.xlsx), 1.7 (.docx), 4.3 (.pptx).
export const fileRegistry: Partial<Record<FileExt, FileHandler<FileData>>> = {};
