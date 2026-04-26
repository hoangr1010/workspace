import type { WorkspaceFile, ExcelFileData, WordFileData, PptxFileData } from './file';

export interface WindowApi {
  // Workspace
  pickWorkspace(): Promise<string | null>;
  listFiles(workspacePath: string): Promise<readonly WorkspaceFile[]>;
  readAllFilesAsText(workspacePath: string): Promise<Record<string, string>>;

  // File IO
  openExcel(filePath: string): Promise<ExcelFileData>;
  saveExcel(filePath: string, snapshot: Record<string, unknown>): Promise<void>;
  openWord(filePath: string): Promise<WordFileData>;
  saveWord(filePath: string, buffer: ArrayBuffer): Promise<void>;
  openPptx(filePath: string): Promise<PptxFileData>;
  savePptxEdit(args: {
    filePath: string;
    slideIndex: number;
    shapeName: string;
    newText: string;
  }): Promise<PptxFileData>;

  // Settings — recent workspaces (newest first, stale paths filtered out)
  getRecentWorkspaces(): Promise<readonly string[]>;
  addRecentWorkspace(path: string): Promise<void>;

  // Events from main → renderer
  onCloseWorkspace(handler: () => void): () => void;
  onOpenWorkspace(handler: () => void): () => void;
}

declare global {
  interface Window {
    readonly api: WindowApi;
  }
}
