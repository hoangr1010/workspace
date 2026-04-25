// PLAN 1.3 / 1.4 / 1.6 / 1.7 / 1.8 / 1.9 — Workspace Zustand store
// See docs/architecture.md → "State management".

import { create } from 'zustand';
import type { WorkspaceFile, FileData } from '../types/file';

export interface WorkspaceState {
  workspacePath: string | null;
  files: readonly WorkspaceFile[];
  openFiles: readonly string[];
  activeFile: string | null;
  fileData: ReadonlyMap<string, FileData>;
  dirtyFiles: ReadonlySet<string>;

  setWorkspace(path: string): Promise<void>;
  openFile(filePath: string): Promise<void>;
  closeFile(filePath: string): void;
  setActiveFile(filePath: string): void;
  updateFileData(filePath: string, data: FileData): void;
  markDirty(filePath: string): void;
  markClean(filePath: string): void;
}

export const useWorkspaceStore = create<WorkspaceState>()(() => ({
  workspacePath: null,
  files: [],
  openFiles: [],
  activeFile: null,
  fileData: new Map(),
  dirtyFiles: new Set(),

  setWorkspace: async (path: string) => {
    throw new Error(`PLAN 1.3 — setWorkspace not implemented (path: ${path})`);
  },
  openFile: async (filePath: string) => {
    throw new Error(`PLAN 1.4 / 1.6 / 1.7 — openFile not implemented (path: ${filePath})`);
  },
  closeFile: (filePath: string) => {
    throw new Error(`PLAN 1.4 — closeFile not implemented (path: ${filePath})`);
  },
  setActiveFile: (filePath: string) => {
    throw new Error(`PLAN 1.4 — setActiveFile not implemented (path: ${filePath})`);
  },
  updateFileData: (filePath: string, data: FileData) => {
    throw new Error(`PLAN 1.6 / 1.7 — updateFileData not implemented (path: ${filePath}, kind: ${data.kind})`);
  },
  markDirty: (filePath: string) => {
    throw new Error(`PLAN 1.4 / 1.8 / 1.9 — markDirty not implemented (path: ${filePath})`);
  },
  markClean: (filePath: string) => {
    throw new Error(`PLAN 1.8 / 1.9 — markClean not implemented (path: ${filePath})`);
  },
}));
