import type { IWorkbookData } from '@univerjs/core';

export type FileExt = '.xlsx' | '.docx' | '.pptx';

// The shape Univer hands us via FWorkbook.save() and accepts in createWorkbook().
// Crosses the IPC structured-clone boundary unchanged.
export type UniverSnapshot = IWorkbookData;

export interface WorkspaceFile {
  readonly name: string;
  readonly ext: FileExt;
  readonly filePath: string;
}

export interface ExcelFileData {
  readonly kind: 'excel';
  readonly snapshot: UniverSnapshot;
}

export interface WordFileData {
  readonly kind: 'word';
  readonly buffer: ArrayBuffer;
}

export interface PptxFileData {
  readonly kind: 'pptx';
  readonly buffer: ArrayBuffer;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly parsed: Record<string, any>;
}

export type FileData = ExcelFileData | WordFileData | PptxFileData;
