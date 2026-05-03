// PLAN 1.7 / 1.9 — Word handlers (.docx ArrayBuffer read/write)
// Implements WindowApi.{openWord, saveWord}.
// See src/types/ipc.ts and docs/architecture.md → "File type handling / Word".

import { promises as fs } from 'node:fs';
import type { WordFileData } from '../../src/types/file';

export async function openWord(filePath: string): Promise<WordFileData> {
  const bytes = await fs.readFile(filePath);
  // Slice to a clean ArrayBuffer — Node Buffers can share memory with a larger
  // pool, so we copy the exact byte range to send a standalone buffer across
  // the IPC structured-clone boundary.
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  return { kind: 'word', buffer };
}

export async function saveWord(filePath: string, buffer: ArrayBuffer): Promise<void> {
  // Wrap the ArrayBuffer in a Uint8Array view so fs.writeFile sees exactly
  // these bytes — passing the ArrayBuffer to Buffer.from would also work, but
  // a typed-array view sidesteps the historical Buffer.from(arrayBuffer) edge
  // cases when the caller hands us a non-zero-byteOffset slice.
  await fs.writeFile(filePath, new Uint8Array(buffer));
}
