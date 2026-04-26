// PLAN 1.3 — electron-store singleton (UI prefs only, no secrets)
// See docs/architecture.md → "Settings".

import Store from 'electron-store';

interface AppSettings {
  recentWorkspaces?: string[];
}

export const settingsStore = new Store<AppSettings>({
  name: 'settings',
});

export const RECENT_WORKSPACES_CAP = 8;
