# Keyboard shortcuts

Source of truth for every keyboard shortcut wired in this app.
Defined in [`electron/main.ts`](../../electron/main.ts) (App menu) unless noted.

> When you add, change, or remove an accelerator, update this file in the **same commit**. The PostToolUse `check-docs.sh` hook flags commits that touch shortcut definitions without updating this file.

---

## Custom shortcuts

| Shortcut | Action | Where it lives |
|---|---|---|
| **⌘⇧N** | Open a new window in welcome state (skips auto-resume via `?fresh=1`) | File → New Window |
| **⌘O** | Open a folder picker in the focused window; picked folder becomes the active workspace | File → Open Workspace… |
| **⌘⇧W** | Return the focused window to the welcome state (workspace cleared, recents preserved) | File → Close Workspace |

---

## Platform defaults (no custom accelerator)

These come from Electron's built-in `role` items and use the platform's standard binding:

| Role | Mac default |
|---|---|
| `undo` / `redo` | ⌘Z / ⌘⇧Z |
| `cut` / `copy` / `paste` | ⌘X / ⌘C / ⌘V |
| `selectAll` | ⌘A |
| `reload` / `forceReload` | ⌘R / ⌘⇧R |
| `toggleDevTools` | ⌘⌥I |
| `togglefullscreen` | ⌃⌘F |
| `minimize` / `zoom` / `close` | ⌘M / — / ⌘W |
| `quit` | ⌘Q |
| `hide` / `hideOthers` | ⌘H / ⌘⌥H |

---

## Adding a new shortcut

1. Add an item to the menu template in [`electron/main.ts`](../../electron/main.ts) with an `accelerator` string. Use `'CmdOrCtrl+…'` so it works on both macOS and Windows/Linux.
2. If the action lives in the renderer, send an IPC event from `click(_item, focused)` and subscribe in [`src/App.tsx`](../../src/App.tsx) via the matching `window.api.on…` method (declared in [`src/types/ipc.ts`](../../src/types/ipc.ts) and exposed in [`electron/preload.ts`](../../electron/preload.ts)).
3. Add the channel constant to [`electron/ipc-channels.ts`](../../electron/ipc-channels.ts).
4. **Add a row to the table above** in the same commit.
