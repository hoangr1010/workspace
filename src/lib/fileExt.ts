import type { FileExt } from '../types/file';

export const KNOWN_EXTS: readonly FileExt[] = ['.xlsx', '.docx', '.pptx'];

/**
 * Extract the file extension as a typed FileExt.
 * @param filePath  Absolute or relative file path.
 * @returns         Lowercased extension with leading dot (e.g. ".xlsx"), or null if unrecognized.
 */
export function getFileExt(filePath: string): FileExt | null {
  const dot = filePath.lastIndexOf('.');
  if (dot < 0) return null;
  const ext = filePath.slice(dot).toLowerCase();
  return (KNOWN_EXTS as readonly string[]).includes(ext) ? (ext as FileExt) : null;
}
