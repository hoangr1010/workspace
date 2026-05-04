import { describe, it, expect, beforeEach } from 'vitest';
import { register, unregister, getSnapshot } from '../excelLiveSnapshot';
import type { UniverSnapshot } from '../../types/file';

// The registry is module-level state. Each test starts from a known-empty
// state by unregistering anything we touched, since vitest doesn't reset
// modules between tests in the same file.
const TEST_PATHS = ['/tmp/a.xlsx', '/tmp/b.xlsx', '/tmp/dup.xlsx'];

beforeEach(() => {
  for (const p of TEST_PATHS) unregister(p);
});

// Fake snapshots — the registry doesn't read fields, so any tagged object
// works. Cast at the boundary to satisfy the strict UniverSnapshot type.
function fakeSnapshot(tag: Record<string, unknown>): UniverSnapshot {
  return tag as unknown as UniverSnapshot;
}

describe('excelLiveSnapshot registry', () => {
  it('returns undefined for an unregistered path', () => {
    expect(getSnapshot('/tmp/never-registered.xlsx')).toBeUndefined();
  });

  it('after register, getSnapshot returns the value the getter produces', () => {
    const snap = fakeSnapshot({ id: 'wb', name: 'A' });
    register('/tmp/a.xlsx', () => snap);
    expect(getSnapshot('/tmp/a.xlsx')).toBe(snap);
  });

  it('register overwrites a prior getter for the same path (last writer wins)', () => {
    register('/tmp/dup.xlsx', () => fakeSnapshot({ tag: 'first' }));
    register('/tmp/dup.xlsx', () => fakeSnapshot({ tag: 'second' }));
    expect(getSnapshot('/tmp/dup.xlsx')).toEqual({ tag: 'second' });
  });

  it('unregister removes the entry — subsequent getSnapshot returns undefined', () => {
    register('/tmp/a.xlsx', () => fakeSnapshot({ tag: 'gone' }));
    unregister('/tmp/a.xlsx');
    expect(getSnapshot('/tmp/a.xlsx')).toBeUndefined();
  });

  it('two paths register independently — getting one does not affect the other', () => {
    register('/tmp/a.xlsx', () => fakeSnapshot({ which: 'a' }));
    register('/tmp/b.xlsx', () => fakeSnapshot({ which: 'b' }));
    expect(getSnapshot('/tmp/a.xlsx')).toEqual({ which: 'a' });
    expect(getSnapshot('/tmp/b.xlsx')).toEqual({ which: 'b' });
  });

  it('getter is invoked fresh on every getSnapshot — returns latest live value', () => {
    // This is the whole point of the registry: it stores a callback, not a
    // cached snapshot. Mutate state outside the getter and verify the next
    // call sees the new state.
    let live = fakeSnapshot({ rev: 1 });
    register('/tmp/a.xlsx', () => live);
    expect(getSnapshot('/tmp/a.xlsx')).toEqual({ rev: 1 });
    live = fakeSnapshot({ rev: 2 });
    expect(getSnapshot('/tmp/a.xlsx')).toEqual({ rev: 2 });
  });
});
