// PLAN 1.9 — failing tests for the .docx save path.
// Locks down the byte-level contract before the implementation is written.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import { randomBytes } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { openWord, saveWord } from '../word.handler';

let scratch = '';

beforeEach(async () => {
  scratch = await fs.mkdtemp(path.join(os.tmpdir(), 'plan-1-9-word-'));
});

afterEach(async () => {
  await fs.rm(scratch, { recursive: true, force: true });
});

function abFromBytes(bytes: Uint8Array): ArrayBuffer {
  // Standalone ArrayBuffer covering exactly `bytes`, regardless of pool offset.
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return ab;
}

async function readBytes(p: string): Promise<Uint8Array> {
  const b = await fs.readFile(p);
  return new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
}

describe('saveWord — byte-level contract', () => {
  it('writes the exact bytes of the input ArrayBuffer to disk', async () => {
    const target = path.join(scratch, 'a.docx');
    const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x00, 0x10, 0x20, 0x30]);
    await saveWord(target, abFromBytes(bytes));
    const onDisk = await readBytes(target);
    expect(onDisk).toEqual(bytes);
  });

  it('overwrites and SHRINKS an existing file (no leftover bytes from the prior larger write)', async () => {
    const target = path.join(scratch, 'shrink.docx');
    const big = new Uint8Array(1024).fill(0xaa);
    const small = new Uint8Array(100).fill(0xbb);

    await saveWord(target, abFromBytes(big));
    await saveWord(target, abFromBytes(small));

    const onDisk = await readBytes(target);
    expect(onDisk.byteLength).toBe(100);
    expect(onDisk).toEqual(small);
  });

  it('overwrites and GROWS an existing file', async () => {
    const target = path.join(scratch, 'grow.docx');
    const small = new Uint8Array(100).fill(0xbb);
    const big = new Uint8Array(10 * 1024).fill(0xcc);

    await saveWord(target, abFromBytes(small));
    await saveWord(target, abFromBytes(big));

    const onDisk = await readBytes(target);
    expect(onDisk.byteLength).toBe(10 * 1024);
    expect(onDisk).toEqual(big);
  });

  it('writes a 0-byte ArrayBuffer as a 0-byte file', async () => {
    const target = path.join(scratch, 'empty.docx');
    await saveWord(target, new ArrayBuffer(0));
    const stat = await fs.stat(target);
    expect(stat.size).toBe(0);
  });

  it('round-trips a 5 MB random buffer byte-identically', async () => {
    const target = path.join(scratch, 'big.docx');
    const bytes = new Uint8Array(randomBytes(5 * 1024 * 1024));
    await saveWord(target, abFromBytes(bytes));
    const onDisk = await readBytes(target);
    expect(onDisk.byteLength).toBe(bytes.byteLength);
    expect(Buffer.from(onDisk).equals(Buffer.from(bytes))).toBe(true);
  });

  it('round-trips openWord → saveWord → openWord byte-identically', async () => {
    // openWord just slices file bytes into an ArrayBuffer, so any payload works
    // — this verifies the open path's slice() and the save path's Buffer.from()
    // are symmetric and don't accidentally widen or truncate the byte range.
    const sourcePath = path.join(scratch, 'source.docx');
    const targetPath = path.join(scratch, 'target.docx');
    const original = new Uint8Array(randomBytes(64 * 1024));
    await fs.writeFile(sourcePath, original);

    const opened = await openWord(sourcePath);
    expect(opened.kind).toBe('word');
    expect(opened.buffer.byteLength).toBe(original.byteLength);

    await saveWord(targetPath, opened.buffer);

    const reopened = await openWord(targetPath);
    expect(reopened.buffer.byteLength).toBe(original.byteLength);
    expect(new Uint8Array(reopened.buffer)).toEqual(original);
  });

  it('writes only the bytes covered by a non-zero-byteOffset ArrayBuffer view, not the underlying pool', async () => {
    // Catches the Buffer.from(arrayBuffer) foot-gun: passing a typed-array's
    // .buffer directly would write the entire pool, ignoring byteOffset/length.
    const target = path.join(scratch, 'view.docx');
    const pool = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const view = pool.subarray(3, 7); // bytes [3, 4, 5, 6]
    // Build a clean ArrayBuffer holding exactly the view's bytes — this is what
    // the renderer's coerceExportToArrayBuffer is supposed to deliver.
    const ab = abFromBytes(view);

    await saveWord(target, ab);

    const onDisk = await readBytes(target);
    expect(onDisk).toEqual(new Uint8Array([3, 4, 5, 6]));
  });

  it('handles a path with spaces and unicode characters', async () => {
    const dir = path.join(scratch, 'some folder');
    await fs.mkdir(dir, { recursive: true });
    const target = path.join(dir, 'résumé.docx');
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);

    await saveWord(target, abFromBytes(bytes));

    const onDisk = await readBytes(target);
    expect(onDisk).toEqual(bytes);
  });

  it('rejects when the parent directory does not exist (no silent success, no partial file)', async () => {
    const target = path.join(scratch, 'does-not-exist', 'x.docx');
    const bytes = new Uint8Array([1, 2, 3]);

    await expect(saveWord(target, abFromBytes(bytes))).rejects.toThrow();
    // And no partial file should appear at the broken path.
    await expect(fs.stat(target)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('is idempotent: writing the same buffer twice ends in the same final state', async () => {
    const target = path.join(scratch, 'idempotent.docx');
    const bytes = new Uint8Array(randomBytes(2048));
    const ab = abFromBytes(bytes);

    await saveWord(target, ab);
    await saveWord(target, ab);

    const onDisk = await readBytes(target);
    expect(onDisk).toEqual(bytes);
  });

  it('does not mutate the caller-supplied ArrayBuffer', async () => {
    const target = path.join(scratch, 'no-mutate.docx');
    const bytes = new Uint8Array(randomBytes(1024));
    const ab = abFromBytes(bytes);
    const snapshot = new Uint8Array(ab.byteLength);
    snapshot.set(new Uint8Array(ab));

    await saveWord(target, ab);

    expect(new Uint8Array(ab)).toEqual(snapshot);
  });

  it('handles two consecutive writes to different paths without cross-corruption', async () => {
    const a = path.join(scratch, 'a.docx');
    const b = path.join(scratch, 'b.docx');
    const bytesA = new Uint8Array(randomBytes(512));
    const bytesB = new Uint8Array(randomBytes(2048));

    await Promise.all([
      saveWord(a, abFromBytes(bytesA)),
      saveWord(b, abFromBytes(bytesB)),
    ]);

    expect(await readBytes(a)).toEqual(bytesA);
    expect(await readBytes(b)).toEqual(bytesB);
  });
});
