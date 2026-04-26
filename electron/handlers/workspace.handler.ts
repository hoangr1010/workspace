// PLAN 1.3 / 1.5 / 2.5 — Workspace handlers
// Implements WindowApi.{pickWorkspace, listFiles, readAllFilesAsText}.
// See src/types/ipc.ts and docs/architecture.md → "Process architecture".

import { BrowserWindow, dialog } from 'electron';
import type { WorkspaceFile } from '../../src/types/file';

export async function pickWorkspace(): Promise<string | null> {
  const parent = BrowserWindow.getFocusedWindow();
  const result = await (parent
    ? dialog.showOpenDialog(parent, {
        title: 'Open workspace',
        properties: ['openDirectory', 'createDirectory'],
      })
    : dialog.showOpenDialog({
        title: 'Open workspace',
        properties: ['openDirectory', 'createDirectory'],
      }));
  if (result.canceled) return null;
  return result.filePaths[0] ?? null;
}

export async function listFiles(workspacePath: string): Promise<readonly WorkspaceFile[]> {
  throw new Error(`PLAN 1.5 — listFiles not implemented (path: ${workspacePath})`);
}

export async function readAllFilesAsText(workspacePath: string): Promise<Record<string, string>> {
  throw new Error(`PLAN 2.5 — readAllFilesAsText not implemented (path: ${workspacePath})`);
}
