// PLAN 1.3 — Settings handlers (electron-store, no secrets)
// Implements WindowApi.{getLastWorkspace, setLastWorkspace}.
// See src/types/ipc.ts and docs/architecture.md → "Process architecture".

export async function getLastWorkspace(): Promise<string | null> {
  throw new Error('PLAN 1.3 — getLastWorkspace not implemented');
}

export async function setLastWorkspace(path: string): Promise<void> {
  throw new Error(`PLAN 1.3 — setLastWorkspace not implemented (path: ${path})`);
}
