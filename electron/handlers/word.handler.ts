// PLAN 1.7 / 1.9 — Word handlers (.docx ArrayBuffer read/write)
// Implements WindowApi.{openWord, saveWord}.
// See src/types/ipc.ts and docs/architecture.md → "File type handling / Word".

import type { WordFileData } from '../../src/types/file';

export async function openWord(filePath: string): Promise<WordFileData> {
  throw new Error(`PLAN 1.7 — openWord not implemented (path: ${filePath})`);
}

export async function saveWord(filePath: string, buffer: ArrayBuffer): Promise<void> {
  throw new Error(`PLAN 1.9 — saveWord not implemented (path: ${filePath}, bytes: ${buffer.byteLength})`);
}
