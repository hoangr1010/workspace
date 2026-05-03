// PLAN 1.9 — failing tests for the SuperDoc export shape coercion.
// Node 18+ exposes global Blob and ArrayBuffer, so these run under the
// default `environment: 'node'` from vitest.config.ts.

import { describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';
import { coerceExportToArrayBuffer } from '../wordSaveRegistry';

describe('coerceExportToArrayBuffer', () => {
  it('returns the same ArrayBuffer reference when given an ArrayBuffer (no needless copy)', async () => {
    const ab = new ArrayBuffer(8);
    new Uint8Array(ab).set([1, 2, 3, 4, 5, 6, 7, 8]);

    const result = await coerceExportToArrayBuffer(ab);

    expect(result).toBe(ab);
  });

  it('resolves a Blob to an ArrayBuffer with byte-identical content', async () => {
    const bytes = new Uint8Array([10, 20, 30, 40, 50]);
    const blob = new Blob([bytes]);

    const result = await coerceExportToArrayBuffer(blob);

    expect(new Uint8Array(result)).toEqual(bytes);
  });

  it('resolves an empty Blob to a 0-byte ArrayBuffer', async () => {
    const result = await coerceExportToArrayBuffer(new Blob([]));
    expect(result.byteLength).toBe(0);
  });

  it('resolves a 1 MB Blob byte-identically', async () => {
    const bytes = new Uint8Array(randomBytes(1024 * 1024));
    const blob = new Blob([bytes]);

    const result = await coerceExportToArrayBuffer(blob);

    expect(result.byteLength).toBe(bytes.byteLength);
    expect(Buffer.from(result).equals(Buffer.from(bytes))).toBe(true);
  });

  it('rejects when given undefined / void (SuperDoc returned no Blob — likely triggerDownload mistake)', async () => {
    // SuperDoc.export resolves to `void` when triggerDownload is true;
    // the coercion must surface that as an error rather than silently writing
    // a corrupt 0-byte file to disk.
    await expect(
      coerceExportToArrayBuffer(undefined as unknown as Blob),
    ).rejects.toThrow();
  });
});
