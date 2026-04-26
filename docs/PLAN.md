# PLAN.md — MVP Build Plan

See [PRD.md](PRD.md) for product description and user flows.
See [architecture.md](architecture.md) for all stack and library decisions.

---

## Parallelism legend

Each task is tagged `[WN]` — its **wave number within the milestone**.
Tasks sharing the same wave number have no dependencies on each other and can be worked simultaneously.
A task at wave N can only start once all tasks at wave N-1 are complete.

---

## Milestones

Each milestone is independently shippable and testable before the next begins.

---

### Milestone 1: Workspace — Render & Edit Word and Excel

**Goal:** User can open a workspace folder, open `.xlsx` and `.docx` files in tabs, and edit them with full fidelity — looks and works like real Excel and Word.

- [x] 1.1 App shell: 3-column layout (sidebar, viewer area, right panel placeholder) [W1]
- [x] 1.2 IPC bridge: main reads file → sends content to renderer [W1]
- [x] 1.3 Workspace folder picker → persisted to `electron-store` [W2]
- [ ] 1.4 Tab bar: open multiple files, close tabs, dirty indicator (`•`) [W2]
- [ ] 1.5 File tree: list `.xlsx` and `.docx` files only [W3]
- [ ] 1.6 Excel: SheetJS reads `.xlsx` → Univer snapshot → renderer mounts Univer with full toolbar, formula bar, multi-sheet tabs [W4]
- [ ] 1.7 Word: main reads `.docx` → ArrayBuffer → renderer mounts SuperDoc with full toolbar [W4]
- [ ] 1.8 Excel: direct cell editing → dirty state → save via SheetJS [W5]
- [ ] 1.9 Word: direct text editing → dirty state → save via SuperDoc export API [W5]
- [ ] 1.10 Keyboard shortcut: Cmd+S saves the active file [W6]

---

### Milestone 2: Chat — AI Modifies Files Directly

**Goal:** User can chat with Claude Code CLI and ask it to modify open files. Changes are applied immediately (no diff yet), with undo as a safety net.

- [ ] 2.1 Right panel: chat input + conversation history [W1]
- [ ] 2.2 Startup check: `claude --version` → show install/login instructions in settings if missing [W1]
- [ ] 2.3 IPC: renderer sends `{ message, fileContext }` → main spawns `claude -p` with JSON output [W2]
- [ ] 2.4 Error surfaces if CLI missing / unauthenticated / times out (120s) [W2]
- [ ] 2.5 Main parses Claude response → applies changes directly to file data in renderer [W3]
- [ ] 2.6 Excel: AI change applied via Univer Facade API (`sheet.getRange().setValue()`) [W4]
- [ ] 2.7 Word: AI change applied via SuperDoc programmatic edit [W4]
- [ ] 2.8 Undo: snapshot file state before each AI change → Cmd+Z restores last state [W4]

---

### Milestone 3: Diff — Show Changes Before Applying

**Goal:** AI-proposed changes are shown as a visual diff. User approves or rejects each one before anything is applied. This is the core value prop of the app.

- [ ] 3.1 Claude response held as `pending[]` — not applied immediately [W1]
- [ ] 3.2 Changes panel (below chat): one card per change showing `old → new` + reason [W1]
- [ ] 3.3 Excel: pending cell highlighted green; value not yet changed [W2]
- [ ] 3.4 Word: pending paragraph highlighted; text not yet changed [W2]
- [ ] 3.5 Approve → apply change + remove highlight [W2]
- [ ] 3.6 Reject → discard + remove highlight [W2]
- [ ] 3.7 Approve All / Reject All bulk actions [W3]
- [ ] 3.8 Undo last approved change (restore snapshot) [W3]

---

### Milestone 4: PowerPoint

**Goal:** User can open, view, and edit `.pptx` files. AI can propose changes to slide elements through the same diff flow as M3.

- [ ] 4.1 File tree: add `.pptx` files [W1]
- [ ] 4.2 Main: reads `.pptx` → sends `ArrayBuffer` to renderer [W1]
- [ ] 4.3 Renderer: `pptxtojson` parses buffer → React slide renderer (elements as positioned `<div>`, points × 96/72) [W2]
- [ ] 4.4 Slide thumbnail list in sidebar panel [W3]
- [ ] 4.5 Click element → selection state stores `shapeName` [W3]
- [ ] 4.6 Edit: IPC sends `{ slideIndex, shapeName, newText }` → main uses JSZip + fast-xml-parser to edit XML → repacks → re-renders [W4]
- [ ] 4.7 AI changes: pending element highlighted with border → approve/reject same as M3 [W5]

---

### Deferred to v2

- Windows packaging (`.exe`)
- Workflow builder (chain tasks, automate across files)
- Collaboration / multi-user
- Charts rendering in PowerPoint
