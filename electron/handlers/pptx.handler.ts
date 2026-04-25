// PLAN 4.2 / 4.6 — PowerPoint handlers (JSZip + fast-xml-parser)
// Implements WindowApi.{openPptx, savePptxEdit}.
// See src/types/ipc.ts and docs/architecture.md → "File type handling / PowerPoint".

import type { PptxFileData } from '../../src/types/file';

export async function openPptx(filePath: string): Promise<PptxFileData> {
  throw new Error(`PLAN 4.2 — openPptx not implemented (path: ${filePath})`);
}

export async function savePptxEdit(args: {
  filePath: string;
  slideIndex: number;
  shapeName: string;
  newText: string;
}): Promise<PptxFileData> {
  throw new Error(`PLAN 4.6 — savePptxEdit not implemented (path: ${args.filePath}, slide: ${args.slideIndex}, shape: ${args.shapeName})`);
}
