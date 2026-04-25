# PRD: AI Workspace for Non-Technical Professionals

## Problem

Existing AI tools (ChatGPT, Copilot, Claude web) help people edit Office files, but they have three fundamental limitations:

1. **One file at a time.** Users can only attach a single file per session. Real work spans multiple related files — a budget sheet, a report doc, and a summary deck all at once.
2. **Hidden changes.** AI edits files silently. Users can't see a diff of what changed the way a coder can in Git — they just trust the AI got it right, or read the entire document again to check.
3. **No workflow.** Every session starts from scratch. Users can't chain tasks, automate repetitive work, or build reusable processes across files.

The deeper problem: **Claude Code already solves all three for developers** — multi-file context, visible diffs, approval flow, automation. But its interface is a terminal. Non-technical workers can't use it.

---

## Vision

**Claude Code for office workers** — a friendly desktop workspace that gives non-technical professionals the same power developers get from Claude Code: multi-file AI, full visibility into every change, and control over what gets applied.

Users bring their own Claude subscription. No extra cost.

The UI should feel like VS Code — a familiar, professional workspace — but designed for people who have never touched a terminal.

---

## Target Users

**Primary:** Non-technical professional workers who live in Office files
- **Marketers** — campaign reports, budget trackers, pitch decks across multiple files
- **Writers / Editors** — proposals, reports, briefs that reference source documents
- **Business analysts** — Excel models, Word summaries, PowerPoint presentations that all need to stay in sync

**Not targeting:** Developers or power users (they already have Claude Code).

---

## How It's Different

| Problem with existing tools | How this app solves it |
|---|---|
| One file at a time | Workspace holds all project files; AI has context across all of them |
| Can't see what AI changed | Every change shown as a visual diff; nothing applied without user seeing it |
| No control over AI edits | User approves or rejects every individual change — 100% control |
| Starts from scratch each session | Workspace persists; files, context, and history stay between sessions |
| Expensive or locked to an ecosystem | User uses their own Claude subscription — no extra cost |

---

## Core Concepts

### Workspace
A folder the user designates as their project. All files inside are available to the AI. The AI can read across multiple files to build context, not just the one currently open.

### Multi-file AI context
The user can ask Claude something that spans files: *"Update the executive summary in the Word doc to match the new numbers in the Excel sheet."* Claude reads both, proposes changes to both, and the user reviews them in a single diff panel.

### Change Visibility (Diff View)
Every AI-proposed change is shown as a visual diff — like what developers see in Git, but rendered for Office files:
- **Excel:** old value → new value, cell highlighted
- **Word:** struck-through old text, new text in green
- **PowerPoint:** element outline + before/after text

Nothing is applied until the user explicitly approves it.

### Approve / Reject per Change
Claude returns a structured list of changes. The user sees each one individually and approves or rejects. Approve All and Reject All available for speed.

---

## MVP Scope (v1)

**Goal:** User can create a workspace, add Office files, ask Claude to create or edit them across files, see exactly what changed, and approve or reject each change.

| Feature | In v1 |
|---|---|
| Electron desktop app (Mac) | Yes |
| Workspace — folder picker, file tree, persisted between sessions | Yes |
| Open and view multiple files at once (tabbed) | Yes |
| Excel: render + AI create/edit (Univer + SheetJS) | Yes |
| Word: render + AI create/edit (SuperDoc) | Yes |
| PowerPoint: render + AI create/edit (pptxtojson + custom renderer) | Yes |
| Multi-file AI context (Claude reads all workspace files) | Yes |
| Visual diff per change (cell / paragraph / slide element) | Yes |
| Approve / Reject per change + Approve All / Reject All | Yes |
| Undo last approved change | Yes |
| User's own Claude subscription (API key in settings) | Yes |
| VS Code-inspired layout — sidebar, tabs, chat panel, diff panel | Yes |
| Windows support | No — v2 |
| Workflow builder (chain tasks, automate across files) | No — v2 |
| AI-triggered automations (collect images, send outputs) | No — v2 |
| Collaboration / multi-user | No — v2 |
| Charts rendering in PowerPoint | No — v2 |

---

## MVP User Flow

**Creating a file from scratch:**
1. User opens app, creates or opens a workspace folder
2. Types: *"Create a Q4 budget tracker for a marketing team with columns for channel, budget, spend, and variance"*
3. Claude creates a new `.xlsx` in the workspace — user sees it appear in the file tree
4. Diff panel shows the new file structure; user approves
5. File is saved to workspace

**Editing across files:**
1. User has `budget.xlsx` and `q4_report.docx` open in tabs
2. Types: *"Update the executive summary in the Word doc to reflect the final numbers from the Excel sheet"*
3. Claude reads both files, proposes edits to the Word doc referencing the Excel data
4. Diff panel shows the paragraph changes with old/new text
5. User approves — Word doc is updated

**Iterating on a deck:**
1. User has `pitch.pptx` open
2. Types: *"Make the title slide more compelling and shorten the bullet points on slide 3"*
3. Claude proposes changes to two slides
4. User sees each proposed change highlighted on the slide; approves slide 1 title, rejects slide 3 (prefers original)
5. Only the approved change is applied

---

## UI Layout

Inspired by VS Code — familiar to power users, approachable for non-technical users:

```
┌──────────────────────────────────────────────────────────┐
│  [Workspace Name]                           [Settings]   │
├────────────┬─────────────────────────┬───────────────────┤
│            │  budget.xlsx  │ q4.docx │                   │
│  File Tree │─────────────────────────│  Chat + Diff      │
│            │                         │  Panel            │
│  budget.xlsx              │           │                   │
│  q4_report.docx           │  File     │  [pending changes │
│  pitch.pptx               │  Viewer   │   listed here]    │
│                           │           │                   │
│  + Add file               │           │  [chat input]     │
└────────────┴─────────────────────────┴───────────────────┘
```

- **Left:** file tree for the workspace
- **Center:** file viewer/editor (tabbed, multiple files open at once)
- **Right:** chat panel on top, diff/change review panel below

---

## Future Vision (v2+)

- **Workflow builder:** Chain tasks visually — "every Monday, pull latest numbers from Excel, update the deck, email it to the team"
- **AI agents:** Claude autonomously collects data (images, web content, other files), builds outputs, routes them to people
- **Routines:** Saved, reusable prompt sequences that run on a schedule or trigger
- **Collaboration:** Share a workspace with teammates; see who changed what

---

## Competitive Landscape

| Tool | Gap |
|---|---|
| Microsoft 365 Copilot | Expensive, locked to Microsoft ecosystem, hidden changes with no diff view |
| ChatGPT / Claude web | One file at a time, describes changes in text — user applies manually |
| Notion AI | Cannot open local files |
| Cursor / Windsurf | Developer-only, terminal/code interface |
| Google Workspace AI | Cloud-only, no local files, no diff view |

**The gap:** No tool gives a non-technical office worker a persistent multi-file workspace, full diff visibility, and per-change approval control — powered by an AI subscription they already own.

---

## Success Metrics (MVP)

- User creates a new Office file from a plain-English prompt
- User asks Claude a question spanning two files and sees a coherent answer referencing both
- Every AI-proposed change is visible as a diff before it is applied
- User can approve individual changes and reject others in the same session
- Approved changes are saved correctly to disk for all three file types
- End-to-end flow feels as smooth as opening VS Code and asking Cursor to edit a file
