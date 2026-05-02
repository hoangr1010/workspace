// PLAN 1.3 / 1.4 / 1.6 / 1.7 / 1.8 / 1.9 — Workspace Zustand store
// See docs/architecture.md → "State management".

import { create } from 'zustand';
import type { WorkspaceFile, FileData } from '../types/file';
import { fileRegistry } from '../lib/fileRegistry';
import { getFileExt } from '../lib/fileExt';

export interface WorkspaceState {
  workspacePath: string | null;
  files: readonly WorkspaceFile[];
  openFiles: readonly string[];
  activeFile: string | null;
  fileData: ReadonlyMap<string, FileData>;
  dirtyFiles: ReadonlySet<string>;

  setWorkspace(path: string): Promise<void>;
  closeWorkspace(): void;
  openFile(filePath: string): Promise<void>;
  closeFile(filePath: string): void;
  setActiveFile(filePath: string): void;
  updateFileData(filePath: string, data: FileData): void;
  markDirty(filePath: string): void;
  markClean(filePath: string): void;
}

export const useWorkspaceStore = create<WorkspaceState>()((set, get) => ({
  workspacePath: null,
  files: [],
  openFiles: [],
  activeFile: null,
  fileData: new Map(),
  dirtyFiles: new Set(),

  setWorkspace: async (path: string) => {
    useWorkspaceStore.setState({ workspacePath: path, files: [] });
    await window.api.addRecentWorkspace(path);
    try {
      const files = await window.api.listFiles(path);
      // Guard against a stale response if the workspace was switched mid-flight.
      if (useWorkspaceStore.getState().workspacePath === path) {
        useWorkspaceStore.setState({ files });
      }
    } catch (err) {
      console.error(`Failed to list files for ${path}:`, err);
      if (useWorkspaceStore.getState().workspacePath === path) {
        useWorkspaceStore.setState({ files: [] });
      }
    }
  },
  closeWorkspace: () => {
    useWorkspaceStore.setState({
      workspacePath: null,
      files: [],
      openFiles: [],
      activeFile: null,
    });
  },

  openFile: async (filePath: string) => {
    const state = get();

    // Already open: just activate.
    if (state.openFiles.includes(filePath)) {
      if (state.activeFile !== filePath) {
        set({ activeFile: filePath });
      }
      return;
    }

    // Append to tab list and activate immediately.
    set({
      openFiles: [...state.openFiles, filePath],
      activeFile: filePath,
    });

    // Best-effort load via registry. PLAN 1.6/1.7/4.3 register handlers later;
    // until then, the tab opens with no content (viewer renders an empty state).
    const ext = getFileExt(filePath);
    if (!ext) return;
    const handler = fileRegistry[ext];
    if (!handler) return;

    try {
      const data = await handler.open(filePath);
      const next = new Map(get().fileData);
      next.set(filePath, data);
      set({ fileData: next });
    } catch (err) {
      // Surface in console; viewer-level error UI lands with 1.6/1.7.
      console.error(`Failed to open ${filePath}:`, err);
    }
  },

  closeFile: (filePath: string) => {
    const state = get();
    const idx = state.openFiles.indexOf(filePath);
    if (idx < 0) return;

    const nextOpen = state.openFiles.filter((p) => p !== filePath);

    let nextActive = state.activeFile;
    if (state.activeFile === filePath) {
      // Prefer right neighbour, then left, then null.
      nextActive = nextOpen[idx] ?? nextOpen[idx - 1] ?? null;
    }

    const nextData = new Map(state.fileData);
    nextData.delete(filePath);

    let nextDirty: ReadonlySet<string> = state.dirtyFiles;
    if (state.dirtyFiles.has(filePath)) {
      const dirty = new Set(state.dirtyFiles);
      dirty.delete(filePath);
      nextDirty = dirty;
    }

    set({
      openFiles: nextOpen,
      activeFile: nextActive,
      fileData: nextData,
      dirtyFiles: nextDirty,
    });
  },

  setActiveFile: (filePath: string) => {
    const state = get();
    if (!state.openFiles.includes(filePath)) return;
    if (state.activeFile === filePath) return;
    set({ activeFile: filePath });
  },

  updateFileData: (filePath: string, data: FileData) => {
    const next = new Map(get().fileData);
    next.set(filePath, data);
    set({ fileData: next });
  },

  markDirty: (filePath: string) => {
    const state = get();
    if (state.dirtyFiles.has(filePath)) return;
    const next = new Set(state.dirtyFiles);
    next.add(filePath);
    set({ dirtyFiles: next });
  },

  markClean: (filePath: string) => {
    const state = get();
    if (!state.dirtyFiles.has(filePath)) return;
    const next = new Set(state.dirtyFiles);
    next.delete(filePath);
    set({ dirtyFiles: next });
  },
}));
