// PLAN 1.9 — Renderer-side registry mapping a .docx file path to its current
// SuperDoc instance's exporter. WordViewer registers on onReady, unregisters
// on unmount; registerViewers.tsx looks up the exporter at save time so the
// SuperDoc instance reference never has to leak into Zustand or the IPC types.

export type WordExporter = () => Promise<ArrayBuffer>;

const exporters = new Map<string, WordExporter>();

export function register(filePath: string, exporter: WordExporter): void {
  exporters.set(filePath, exporter);
}

export function unregister(filePath: string): void {
  exporters.delete(filePath);
}

export function get(filePath: string): WordExporter | undefined {
  return exporters.get(filePath);
}

/**
 * SuperDoc.export() resolves to `Blob | void` depending on `triggerDownload`.
 * We always pass `triggerDownload: false`, so a Blob is expected — but we also
 * accept a raw ArrayBuffer in case a future SuperDoc version returns one
 * directly, and we surface `void` as an error rather than silently writing a
 * 0-byte file to disk.
 */
export async function coerceExportToArrayBuffer(
  result: Blob | ArrayBuffer,
): Promise<ArrayBuffer> {
  if (result instanceof ArrayBuffer) return result;
  if (result instanceof Blob) return await result.arrayBuffer();
  throw new Error(
    'SuperDoc.export() returned no Blob — did triggerDownload default to true?',
  );
}

// Test-only escape hatch — the registry is module-level state, so each test
// needs to start from an empty map. Not part of the public surface.
export function __resetForTests(): void {
  exporters.clear();
}
