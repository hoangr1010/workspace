# PLAN.md — MVP Build Plan

See [PRD.md](PRD.md) for product description and user flows.
See [architecture.md](architecture.md) for all stack and library decisions.

---

## Milestones

Each milestone is independently shippable and testable before the next begins.

---

### Milestone 1: Workspace — Render & Edit Word and Excel

**Goal:** User can open a workspace folder, open `.xlsx` and `.docx` files in tabs, and edit them with full fidelity — looks and works like real Excel and Word.

- [ ] App shell: 3-column layout (sidebar, viewer area, right panel placeholder)
- [ ] Workspace folder picker → persisted to `electron-store`
- [ ] File tree: list `.xlsx` and `.docx` files only
- [ ] Tab bar: open multiple files, close tabs, dirty indicator (`•`)
- [ ] IPC bridge: main reads file → sends content to renderer
- [ ] Excel: SheetJS reads `.xlsx` → Univer snapshot → renderer mounts Univer with full toolbar, formula bar, multi-sheet tabs
- [ ] Excel: direct cell editing → dirty state → save via SheetJS
- [ ] Word: main reads `.docx` → ArrayBuffer → renderer mounts SuperDoc with full toolbar
- [ ] Word: direct text editing → dirty state → save via SuperDoc export API
- [ ] Keyboard shortcut: Cmd+S saves the active file

---

### Milestone 2: Chat — AI Modifies Files Directly

**Goal:** User can chat with Claude Code CLI and ask it to modify open files. Changes are applied immediately (no diff yet), with undo as a safety net.

- [ ] Right panel: chat input + conversation history
- [ ] Startup check: `claude --version` → show install/login instructions in settings if missing
- [ ] IPC: renderer sends `{ message, fileContext }` → main spawns `claude -p` with JSON output
- [ ] Main parses Claude response → applies changes directly to file data in renderer
- [ ] Excel: AI change applied via Univer Facade API (`sheet.getRange().setValue()`)
- [ ] Word: AI change applied via SuperDoc programmatic edit
- [ ] Undo: snapshot file state before each AI change → Cmd+Z restores last state
- [ ] Error surfaces if CLI missing / unauthenticated / times out (120s)

---

### Milestone 3: Diff — Show Changes Before Applying

**Goal:** AI-proposed changes are shown as a visual diff. User approves or rejects each one before anything is applied. This is the core value prop of the app.

- [ ] Claude response held as `pending[]` — not applied immediately
- [ ] Changes panel (below chat): one card per change showing `old → new` + reason
- [ ] Excel: pending cell highlighted green; value not yet changed
- [ ] Word: pending paragraph highlighted; text not yet changed
- [ ] Approve → apply change + remove highlight
- [ ] Reject → discard + remove highlight
- [ ] Approve All / Reject All bulk actions
- [ ] Undo last approved change (restore snapshot)

---

### Milestone 4: PowerPoint

**Goal:** User can open, view, and edit `.pptx` files. AI can propose changes to slide elements through the same diff flow as M3.

- [ ] File tree: add `.pptx` files
- [ ] Main: reads `.pptx` → sends `ArrayBuffer` to renderer
- [ ] Renderer: `pptxtojson` parses buffer → React slide renderer (elements as positioned `<div>`, points × 96/72)
- [ ] Slide thumbnail list in sidebar panel
- [ ] Click element → selection state stores `shapeName`
- [ ] Edit: IPC sends `{ slideIndex, shapeName, newText }` → main uses JSZip + fast-xml-parser to edit XML → repacks → re-renders
- [ ] AI changes: pending element highlighted with border → approve/reject same as M3

---

### Deferred to v2

- Windows packaging (`.exe`)
- Workflow builder (chain tasks, automate across files)
- Collaboration / multi-user
- Charts rendering in PowerPoint
