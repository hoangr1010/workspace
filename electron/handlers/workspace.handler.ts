// PLAN 1.3 / 1.5 / 2.5 — Workspace handlers
// Implements WindowApi.{pickWorkspace, listFiles, readAllFilesAsText}.
// See src/types/ipc.ts and docs/architecture.md → "Process architecture".

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { BrowserWindow, dialog } from 'electron';
import type { WorkspaceFile, FileExt } from '../../src/types/file';

const TREE_EXTS: readonly FileExt[] = ['.xlsx', '.docx'];

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
  const out: WorkspaceFile[] = [];
  await walk(workspacePath, out);
  return out;
}

async function walk(dir: string, out: WorkspaceFile[]): Promise<void> {
  let entries: import('node:fs').Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (err) {
    console.warn(`listFiles: cannot read ${dir}:`, err);
    return;
  }

  entries.sort((a, b) => {
    const aDir = a.isDirectory();
    const bDir = b.isDirectory();
    if (aDir !== bDir) return aDir ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, out);
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase() as FileExt;
    if (!(TREE_EXTS as readonly string[]).includes(ext)) continue;
    out.push({ name: entry.name, ext, filePath: full });
  }
}

export async function readAllFilesAsText(workspacePath: string): Promise<Record<string, string>> {
  throw new Error(`PLAN 2.5 — readAllFilesAsText not implemented (path: ${workspacePath})`);
}
