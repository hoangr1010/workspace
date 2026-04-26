// PLAN 1.3 — Settings handlers (electron-store, no secrets)
// Implements WindowApi.{getRecentWorkspaces, addRecentWorkspace}.

import fs from 'node:fs';
import { RECENT_WORKSPACES_CAP, settingsStore } from '../lib/store';

export async function getRecentWorkspaces(): Promise<readonly string[]> {
  const list = settingsStore.get('recentWorkspaces') ?? [];
  // Stale-path guard: drop entries whose folder no longer exists.
  return list.filter((p) => fs.existsSync(p));
}

export async function addRecentWorkspace(path: string): Promise<void> {
  const list = settingsStore.get('recentWorkspaces') ?? [];
  const next = [path, ...list.filter((p) => p !== path)].slice(0, RECENT_WORKSPACES_CAP);
  settingsStore.set('recentWorkspaces', next);
}
