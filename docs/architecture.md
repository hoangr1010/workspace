# Architecture

Single source of truth for how the codebase is structured. Read this before writing any code.

See [PRD.md](PRD.md) for product scope and user flows. See [PLAN.md](PLAN.md) for milestone order and library rationale.

---

## Stack

| Layer | Choice |
|---|---|
| App shell | Electron (Node main + Chromium renderer) |
| Language | **TypeScript, strict mode** — all source is `.ts` / `.tsx` |
| UI framework | React 18 + Vite (`electron-vite` template) |
| Styling | CSS Modules + `src/styles/tokens.css` (design tokens) |
| UI components | Hand-rolled — `src/components/ui/` owns every component; no third-party UI library |
| A11y escape hatch | Add `@radix-ui/react-*` primitives only when needed for dialog/dropdown/tooltip focus-trap and ARIA — not upfront |
| Excel viewer/editor | Univer (`@univerjs/presets` + `UniverSheetsCorePreset`) |
| Excel file IO | SheetJS (`xlsx`) in main process |
| Word viewer/editor | SuperDoc (`@superdoc-dev/react`) — AGPLv3 or commercial |
| PowerPoint parser | `pptxtojson` in renderer |
| PowerPoint modifier | JSZip + `fast-xml-parser` in main process |
| AI | Claude Code CLI (`claude`) invoked via `child_process` from main |
| AI auth | User's own Claude Code subscription — authenticated via `claude` CLI separately; **no API key stored by this app** |
| Settings | `electron-store` in main process (last workspace, UI prefs only — **no secrets**) |
| State management | Zustand (`workspaceStore` — one store for now) |
| Packaging | `electron-builder` → `.dmg` for Mac (v1), `.exe` deferred to v2 |

**TypeScript discipline:**
- `tsconfig.json` has `"strict": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitReturns": true`, `"exactOptionalPropertyTypes": true`
- No `any`. Ever. Use `unknown` + narrowing at boundaries
- IPC payloads are typed on both sides (shared `types/ipc.ts`)
- All React component props declared as interfaces
- All Zustand state shapes declared as interfaces

---

## The one rule

> **Main process owns all file access and all Claude Code CLI invocations. Renderer owns all UI. They talk through `window.api` only.**

- File paths never reach the renderer.
- File content moves as `ArrayBuffer` or typed JSON over IPC.
- Claude Code CLI runs as a child process spawned by main — user authenticates via `claude login` outside the app; this app **never holds API keys or auth tokens**.

---

## Process architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│  MAIN PROCESS  (Node.js, TypeScript)                                     │
│  electron/main.ts + electron/handlers/                                   │
│                                                                          │
│  workspace.handler.ts  — folder picker, list files by extension filter   │
│  excel.handler.ts      — SheetJS: .xlsx bytes ↔ Univer snapshot JSON     │
│  word.handler.ts       — .docx ArrayBuffer read/write                    │
│  pptx.handler.ts       — JSZip + fast-xml-parser: surgical XML edits     │
│  claude.handler.ts     — spawns `claude` CLI, streams stdout, parses JSON│
│  settings.handler.ts   — electron-store get/set (last workspace, prefs)  │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │  contextBridge (electron/preload.ts)
                                    │  exposes window.api (typed)
┌───────────────────────────────────▼─────────────────────────────────────┐
│  RENDERER PROCESS  (Chromium — sandboxed, no Node access)               │
│  src/  — React + TypeScript                                              │
│                                                                          │
│  Sidebar       ViewerArea                   ChatPanel                    │
│  FileTree      ExcelViewer (Univer)         ChatHistory                  │
│                WordViewer  (SuperDoc)       ChatInput                    │
│                PptxViewer  (custom)                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Shared types (`src/types/`)

All type definitions the renderer AND main process agree on live here. Imported by both sides.

### `src/types/file.ts`

```ts
export type FileExt = '.xlsx' | '.docx' | '.pptx';

export interface WorkspaceFile {
  readonly name: string;           // "budget.xlsx"
  readonly ext: FileExt;
  readonly filePath: string;       // absolute path — main only
}

export interface ExcelFileData {
  readonly kind: 'excel';
  readonly snapshot: UniverSnapshot;  // from @univerjs/presets types
}

export interface WordFileData {
  readonly kind: 'word';
  readonly buffer: ArrayBuffer;
}

export interface PptxFileData {
  readonly kind: 'pptx';
  readonly buffer: ArrayBuffer;
  readonly parsed: PptxJson;        // from pptxtojson types
}

export type FileData = ExcelFileData | WordFileData | PptxFileData;
```

### `src/types/ipc.ts`

```ts
import type { WorkspaceFile, FileData } from './file';

export interface WindowApi {
  // Workspace
  pickWorkspace(): Promise<string | null>;
  listFiles(workspacePath: string): Promise<readonly WorkspaceFile[]>;
  readAllFilesAsText(workspacePath: string): Promise<ReadonlyMap<string, string>>;

  // File IO — one call per type to keep types sharp
  openExcel(filePath: string): Promise<ExcelFileData>;
  saveExcel(filePath: string, snapshot: UniverSnapshot): Promise<void>;
  openWord(filePath: string): Promise<WordFileData>;
  saveWord(filePath: string, buffer: ArrayBuffer): Promise<void>;
  openPptx(filePath: string): Promise<PptxFileData>;
  savePptxEdit(args: {
    filePath: string;
    slideIndex: number;
    shapeName: string;
    newText: string;
  }): Promise<PptxFileData>;
  // Settings (no secrets — user auths Claude Code via `claude login` outside the app)
  getLastWorkspace(): Promise<string | null>;
  setLastWorkspace(path: string): Promise<void>;
}

declare global {
  interface Window {
    readonly api: WindowApi;
  }
}
```

The preload wires `contextBridge.exposeInMainWorld('api', ...)` and the main-side handlers implement the same signatures. Any change to the contract is a one-place edit in `ipc.ts`, then TypeScript tells both sides where to update.

---

## Folder structure

```
my-app/
│
├── electron/
│   ├── main.ts                    ← Electron entry, registers IPC handlers
│   ├── preload.ts                 ← contextBridge → window.api
│   └── handlers/
│       ├── workspace.handler.ts   ← folder picker, listFiles, readAllFilesAsText
│       ├── excel.handler.ts       ← SheetJS xlsx ↔ Univer snapshot
│       ├── word.handler.ts        ← docx ArrayBuffer read/write
│       ├── pptx.handler.ts        ← JSZip + fast-xml-parser
│       ├── claude.handler.ts      ← spawns `claude` CLI child process, parses JSON stdout
│       └── settings.handler.ts    ← electron-store get/set (no secrets)
│
├── src/
│   ├── main.tsx                   ← React entry
│   ├── App.tsx                    ← root 3-column layout, settings modal
│   │
│   ├── types/
│   │   ├── file.ts                ← WorkspaceFile, FileData (discriminated union)
│   │   └── ipc.ts                 ← WindowApi, global Window augmentation
│   │
│   ├── styles/
│   │   ├── tokens.css             ← design tokens (colors, spacing, typography)
│   │   └── global.css             ← reset, body, scrollbar
│   │
│   ├── store/
│   │   └── workspaceStore.ts      ← Zustand: workspace, files, tabs, fileData
│   │
│   ├── lib/
│   │   └── fileRegistry.ts        ← FileExt → { open, save, Viewer }
│   │
│   └── components/
│       │
│       ├── Sidebar/
│       │   ├── index.tsx
│       │   ├── Sidebar.module.css
│       │   ├── FileTree.tsx            ← lists workspace files by ext
│       │   └── WorkspacePicker.tsx     ← button → window.api.pickWorkspace
│       │
│       ├── ViewerArea/
│       │   ├── index.tsx               ← routes activeFile to the right Viewer
│       │   ├── ViewerArea.module.css
│       │   ├── TabBar.tsx              ← open files, close, dirty indicator
│       │   ├── ExcelViewer.tsx         ← useRef + createUniver mount
│       │   ├── WordViewer.tsx          ← <SuperDocEditor />
│       │   └── PptxViewer/
│       │       ├── index.tsx           ← thumbnails + active slide
│       │       ├── SlideThumbnails.tsx ← per Milestone 5
│       │       ├── Slide.tsx           ← one slide = positioned div layer
│       │       └── SlideElement.tsx    ← text / shape / image element
│       │
│       ├── Settings/
│       │   ├── SettingsModal.tsx       ← Claude CLI status, install/login help, prefs
│       │   └── Settings.module.css
│       │
│       └── ui/                         ← shared primitives from Simple Design System
│           ├── Button/
│           ├── Dialog/
│           ├── Input/
│           └── ...
│
├── tsconfig.json                  ← strict mode on
├── vite.config.ts
├── electron-builder.yml
├── package.json
└── .eslintrc.cjs
```

---

## State management (Zustand)

### `workspaceStore`

```ts
interface WorkspaceState {
  workspacePath: string | null;
  files: readonly WorkspaceFile[];          // all files in workspace
  openFiles: readonly string[];             // tabs, order matters
  activeFile: string | null;
  fileData: ReadonlyMap<string, FileData>;  // loaded content per file
  dirtyFiles: ReadonlySet<string>;

  // actions
  setWorkspace(path: string): Promise<void>;          // calls listFiles
  openFile(filePath: string): Promise<void>;          // reads via fileRegistry
  closeFile(filePath: string): void;
  setActiveFile(filePath: string): void;
  updateFileData(filePath: string, data: FileData): void;
  markDirty(filePath: string): void;
  markClean(filePath: string): void;
}
```

---

## File type handling (aligned with PLAN)

### Excel

```
Main                                      Renderer
────                                      ────────
SheetJS reads .xlsx bytes
→ workbookToUniverSnapshot()        IPC   → ExcelViewer.tsx
→ ExcelFileData             ─────────────► → createUniver({ container: ref.current })
                                             with UniverSheetsCorePreset
                                          → univerAPI.createWorkbook(snapshot)
                                          → built-in toolbar, formula bar, tabs
                                          → direct cell editing → markDirty

Save:                              IPC
univerSnapshotToWorkbook()   ◄──────────  ← workbook.save() → UniverSnapshot
fs.writeFile()                             ← window.api.saveExcel(path, snapshot)
```

**SheetJS CE style support — confirmed scope (PLAN 1.6).** With `cellStyles: true`, SheetJS surfaces fills (`cell.s.fill` / flattened `patternType`+`fgColor`) and number formats (`cell.z`) on read. It does **not** populate font weight/color or borders. If those become required, fall back to the alternative path below.

**Alternative IO path** (per PLAN): if SheetJS CE style fidelity isn't enough, swap to `@zwight/luckyexcel` `transformExcelToUniver()` in the renderer; main just sends raw `ArrayBuffer`.

**Save-flow gotchas (PLAN 1.8).** The converter is asymmetric — when reversing the snapshot back into a SheetJS workbook for write:
- Strip `#` from color values (Univer stores `#RRGGBB`; SheetJS write expects bare hex).
- Strip the leading `=` from formulas (SheetJS write expects `B3/C3`, not `=B3/C3`).
- Restore a cached `v` for formula cells (the read path omits `v` so Univer recomputes; SheetJS needs a value to write into the file).
- Preserve the snapshot's `zoomRatio` (default 0.85 set by the read path) — only persist a user-changed value to avoid silently writing 0.85 into untouched files.

### Word

```
Main                                      Renderer
────                                      ────────
fs.readFile → ArrayBuffer          IPC   → WordViewer.tsx
→ WordFileData             ─────────────► → <SuperDocEditor
                                               document={buffer}
                                               documentMode="editing"
                                               onChange={() => markDirty(filePath)}
                                             />
                                          → built-in Google-Docs-style toolbar
                                          → direct text editing → markDirty

Save:                              IPC
fs.writeFile(buffer)         ◄──────────  ← superdocRef.export() → ArrayBuffer
```

**Fallback** (per PLAN): `@eigenpal/docx-js-editor` (MIT) if SuperDoc's AGPLv3 is blocked.

### PowerPoint

```
Main                                      Renderer
────                                      ────────
fs.readFile → ArrayBuffer          IPC   → PptxViewer/index.tsx
→ PptxFileData             ─────────────► → pptxtojson(buffer) → parsed JSON
                                          → <SlideThumbnails /> (sidebar list)
                                          → <Slide> maps elements to positioned
                                             <div> (× 96/72 point→pixel)
                                          → click element → selection state
                                             stores `shapeName`

Edit (surgical XML):               IPC
JSZip opens .pptx            ◄──────────  ← { slideIndex, shapeName, newText }
fast-xml-parser finds
  <p:cNvPr name={shapeName}>
edits <a:t> text node
repacks zip → fs.writeFile

                                   IPC
returns fresh ArrayBuffer  ─────────────► → re-parse with pptxtojson → re-render
```

**Backup modifier** (per PLAN): `pptx-automizer` if surgical JSZip edits prove fragile.

---

## Claude Code CLI integration ⚠️ NOT REVIEWED — to be revisited later

**The app does not call the Anthropic API directly.** It spawns the `claude` CLI (Claude Code) as a child process and uses the user's existing Claude subscription. Authentication is entirely outside this app — the user runs `claude login` once in their terminal.

**Multi-file context** (per PRD): Claude sees *all* workspace files, not just open ones.

### Invocation

```
Renderer                                  Main (claude.handler.ts)
────────                                  ────────────────────────
1. User types message in ChatInput
2. workspaceStore collects fileContext:
   Record<filename, textContent>
3. window.api.askClaude({ message, fileContext })
                              IPC
                    ────────────────────► 4. Build one prompt string:
                                            <system_instructions>
                                              Respond ONLY in JSON: { message, changes[] }
                                              Schema: <Change union>
                                            </system_instructions>
                                            <workspace_files>
                                              <file name="budget.xlsx">...text...</file>
                                              <file name="report.docx">...text...</file>
                                            </workspace_files>
                                            <user_request>{message}</user_request>

                                          5. spawn('claude', [
                                               '-p', prompt,
                                               '--output-format', 'json',
                                               '--no-interactive',
                                             ]);

                                          6. Collect stdout → parse as JSON
                                          7. Validate with Zod (ClaudeResponseSchema)
                                          8. Return { message, changes[] }

9. changesStore.setPending(changes)  ◄───
10. ChangesPanel renders cards
11. Viewers highlight pending changes
```

### Startup check

On app start, main runs `claude --version` to detect availability:

```ts
interface ClaudeCliStatus {
  installed: boolean;           // is `claude` on PATH?
  version: string | null;
  authenticated: boolean;       // `claude --print "ping"` returns 0?
}
```

If not installed → SettingsModal shows install instructions.
If not authenticated → SettingsModal shows `claude login` command to run.

### Finding the `claude` binary safely

- Resolve via `which claude` (Unix) — never execute a user-supplied path.
- On macOS, if `claude` is not in the Electron-packaged app's PATH, fall back to common install locations (`/usr/local/bin`, `~/.npm-global/bin`, Homebrew paths) but **never accept a user-provided executable path** from the renderer.

### Spawn safety

- `spawn()` with `shell: false` — never invoke through a shell to avoid argv injection.
- Pass the prompt via stdin or a single `-p` argument, not concatenated into a command string.
- Kill the child after a configurable timeout (e.g., 120s) to prevent a hung CLI from blocking the app.

### Response contract

Claude Code must return JSON matching:

```ts
interface ClaudeResponse {
  message: string;                    // plain-English explanation to user
  changes: readonly Change[];         // see Change union above
}
```

The handler:
1. Parses CLI stdout as JSON.
2. Validates with `ClaudeResponseSchema` (Zod — see "Runtime validation" section).
3. Rejects malformed responses as errors, never as empty change lists.

### Why CLI and not API?

Per PRD: users bring their own Claude subscription — no per-user API cost, no API key this app needs to hold. The CLI's `--output-format json` mode gives a clean parseable stream that fits the structured `Change` contract.

---

## UI layout

```
┌───────────────────────────────────────────────────────────────────────┐
│  [Workspace Name]                                       [Settings ⚙] │
├─────────────┬─────────────────────────────────┬───────────────────────┤
│             │  budget.xlsx  │  report.docx  │ │                       │
│  SIDEBAR    │───────────────────────────────  │  CHAT PANEL           │
│             │                                 │                       │
│  FileTree   │  ViewerArea                     │  ChatHistory          │
│             │                                 │  ChatInput            │
│  budget     │  (Univer / SuperDoc /           │ ─────────────────     │
│  report     │   PptxViewer renders here)      │  CHANGES PANEL        │
│  pitch      │                                 │                       │
│             │                                 │  [• change card]      │
│  + Open     │                                 │  [• change card]      │
│  workspace  │                                 │  Approve All  Undo    │
└─────────────┴─────────────────────────────────┴───────────────────────┘
 240px fixed        flex: 1 (grows)               320px fixed
```

Per PRD: chat panel **on top**, change review panel **below** — two separate panels in the right column, not merged.

---

## File registry pattern (`src/lib/fileRegistry.ts`)

```ts
interface FileHandler<T extends FileData> {
  readonly open: (filePath: string) => Promise<T>;
  readonly save: (filePath: string, data: T) => Promise<void>;
  readonly Viewer: React.ComponentType<{ data: T; filePath: string }>;
}

export const fileRegistry: Record<FileExt, FileHandler<FileData>> = {
  '.xlsx': {
    open: () => window.api.openExcel(filePath),
    save: (path, data) => {
      if (data.kind !== 'excel') throw new Error('kind mismatch');
      return window.api.saveExcel(path, data.snapshot);
    },
    Viewer: ExcelViewer,
  },
  '.docx': { /* ... */ },
  '.pptx': { /* ... */ },
};
```

Adding a new file type = one entry here + one viewer component + one main handler.

---

## Decisions not to revisit

| Decision | Reason |
|---|---|
| TypeScript strict mode everywhere | Catch type mismatches at the IPC boundary before runtime |
| No `any` | Forces proper narrowing; use `unknown` + type guards |
| File paths never in renderer | Security + clean boundary |
| Use Claude Code CLI, never the API | Per PRD: user brings their own Claude subscription; no API key this app must hold |
| `claude` CLI spawned with `shell: false` | Prevents argv injection from file content or prompt |
| No secrets in `electron-store` | Auth lives in the `claude` CLI's own storage; this app holds none |
| SuperDoc AGPLv3 license | Must decide open-source vs. commercial before shipping (PLAN Milestone 4) |
| SheetJS in main, not renderer | Parsing large xlsx off the UI thread |
| Zustand, not Redux/Context | One store now; add `changesStore` when Claude milestone starts |
| No backend server | Desktop-only; Claude Code CLI runs locally on the user's machine |
| Mac-only v1 | Per PRD scope table; Windows is v2 |
| Charts not rendered in PPT v1 | Per PRD scope table |
