// PLAN 1.9 — failing tests for the renderer-side exporter registry.
// Locks down the contract that registerViewers.tsx depends on.

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  register,
  unregister,
  get,
  __resetForTests,
} from '../wordSaveRegistry';

afterEach(() => {
  __resetForTests();
});

describe('wordSaveRegistry', () => {
  it('returns undefined for an unregistered path', () => {
    expect(get('/no/such/path.docx')).toBeUndefined();
  });

  it('returns the same exporter function reference after register', () => {
    const exporter = vi.fn(async () => new ArrayBuffer(0));
    register('/a.docx', exporter);
    expect(get('/a.docx')).toBe(exporter);
  });

  it('replaces the previous registration when register is called twice on the same path (last-writer-wins)', () => {
    const first = vi.fn(async () => new ArrayBuffer(0));
    const second = vi.fn(async () => new ArrayBuffer(0));
    register('/a.docx', first);
    register('/a.docx', second);
    expect(get('/a.docx')).toBe(second);
    expect(get('/a.docx')).not.toBe(first);
  });

  it('unregister removes a previously registered exporter', () => {
    const exporter = vi.fn(async () => new ArrayBuffer(0));
    register('/a.docx', exporter);
    unregister('/a.docx');
    expect(get('/a.docx')).toBeUndefined();
  });

  it('unregister on an unknown path is idempotent (no throw)', () => {
    expect(() => unregister('/never-registered.docx')).not.toThrow();
  });

  it('keeps registrations for different paths independent', () => {
    const expA = vi.fn(async () => new ArrayBuffer(1));
    const expB = vi.fn(async () => new ArrayBuffer(2));
    register('/a.docx', expA);
    register('/b.docx', expB);

    expect(get('/a.docx')).toBe(expA);
    expect(get('/b.docx')).toBe(expB);

    unregister('/a.docx');

    expect(get('/a.docx')).toBeUndefined();
    expect(get('/b.docx')).toBe(expB);
  });

  it('does not invoke the exporter at register time', () => {
    const exporter = vi.fn(async () => {
      throw new Error('should not run during register');
    });
    expect(() => register('/a.docx', exporter)).not.toThrow();
    expect(exporter).not.toHaveBeenCalled();
  });
});
