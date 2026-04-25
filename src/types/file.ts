export type FileExt = '.xlsx' | '.docx' | '.pptx';

export interface WorkspaceFile {
  readonly name: string;
  readonly ext: FileExt;
  readonly filePath: string;
}

export interface ExcelFileData {
  readonly kind: 'excel';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly snapshot: Record<string, any>;
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
