# CLAUDE.md

Guidance for Claude Code when working in this repository.

- **Product:** [`docs/PRD.md`](docs/PRD.md)
- **Build plan & milestones:** [`docs/PLAN.md`](docs/PLAN.md)
- **Stack, architecture, IPC contract, folder structure:** [`docs/architecture.md`](docs/architecture.md)
- **Keyboard shortcuts:** [`docs/commands/shortcuts.md`](docs/commands/shortcuts.md) — every accelerator is listed here. When you add, change, or remove a shortcut in `electron/main.ts`, update this file in the **same commit**. The `check-docs.sh` hook flags commits that miss it.

---

## Workflow at a glance

```
PLAN (§6) → IMPLEMENT → VERIFY (§8) → SHIP (§10) → CLEANUP (§9)
```

1. **Plan (§6)** — overview/diagram, file-by-file steps, Figma confirm for UI, validation section. Wait for engineer approval.
2. **Implement** — if test-first chosen in (c), write tests → fail → code → pass. Otherwise code straight.
3. **Verify (§8)** — run every validation step automatically; loop max 3 attempts per step; never edit a step to make it pass.
4. **Done (§5)** — tsc ✓, lint ✓, all validation steps ✓, UI screenshot ✓, `PLAN.md` checkbox `[x]`.
5. **Ship (§10)** — engineer prompts `merge to main` or `create PR`: fetch + rebase + re-verify, then merge/PR.
6. **Cleanup (§9)** — engineer prompts `cleanup task`: refuses if §10 didn't run; otherwise removes worktree, branch, and task-only temp files.

**Three engineer commands** — `merge to main`, `create PR`, `cleanup task`. Plan mode is automatic.

---

## How to work in this repo

### 1. Always plan before executing
- Before writing any code, present a plan that follows §6 in full — wait for explicit approval before starting
- Break work into small, reviewable chunks — never implement a large feature in one go
- One logical unit at a time (one component, one handler, or one store action)
- If any part of the spec is unclear or underspecified, ask before guessing — do not silently make architectural decisions

### 2. Follow the architecture exactly
- Read [`docs/architecture.md`](docs/architecture.md) before touching any file
- All decisions there are locked — do not deviate without explicit discussion
- IPC contract (`src/types/ipc.ts`) is the source of truth between main and renderer
- File paths never reach the renderer — content moves as `ArrayBuffer` or typed JSON only
- TypeScript strict mode — no `any`, no `.js`/`.jsx`, no type casts without narrowing

### 3. Follow the Figma design exactly

Plan-time rules for UI tasks live in §6(b.1) — confirm the component exists in Figma, or get HTML mockup approval before proceeding.

At implementation time:
- Call `get_design_context` and `get_screenshot` before writing any UI code
- Match the design pixel-for-pixel — no improvising layout, spacing, or color
- Use design tokens from `src/styles/tokens.css` — never hardcode values
- Use CSS Modules — no inline styles, no global class names

### 4. Working from a task number

When given a task by number (e.g. "implement 1.3"):
1. Open [`docs/PLAN.md`](docs/PLAN.md) and find the item to understand its scope. Wave ordering and any "not reviewed" warnings live in PLAN.md alongside the tasks.
2. Read the relevant section of [`docs/architecture.md`](docs/architecture.md) before writing any code
3. **Rename the worktree branch to `task/X.Y-<short-kebab-name>`** as the very first step in the worktree (e.g. `task/1.5-tab-bar`). Use `git branch -m <new-name>` from inside the worktree. This makes `git log`, `gh pr list`, and `preflight-cleanup.sh` self-documenting and lets multiple parallel tasks be told apart at a glance. The `<short-kebab-name>` is 2–4 words derived from the PLAN.md task title.
4. For UI tasks, follow §3 and §6(b.1)
5. For IPC tasks, update the contract in `src/types/ipc.ts` first, then implement the handler in `electron/handlers/`

### 5. Definition of done

A task is complete when ALL of the following pass:
- `npx tsc --noEmit` — zero errors
- `npm run lint` — zero errors
- All verification steps listed in the task plan have been executed by the agent and passed — no step may be skipped
- UI tasks: a screenshot of the rendered deliverable is attached in the response, taken by the agent via preview tools, and confirmed pixel-matched against the Figma screenshot
- The agent marks the corresponding checkbox in [`docs/PLAN.md`](docs/PLAN.md) as `[x]` and includes that change in the same commit. The PostToolUse `check-docs.sh` hook will surface any related `/docs` updates to make.

Do not mark a task done if any of the above fail.

### 6. Plan mode and explicit plan requests

When operating in plan mode OR when the user explicitly asks for a plan for a specific task, the response must include all of the following in order:

**(a) A brief overview** — 2–4 sentences explaining *how* the change works at a high level: what systems are involved, what the data flow is, and what the user will observe. Alternatively (or in addition), a brief ASCII/text diagram showing how the pieces interact. This lets the engineer understand scope before reading the detail.

**(b) The implementation plan** — file-by-file: which files to create/modify, what changes, in what order, and any architectural decisions or unknowns flagged for the user.

**(b.1) For any UI task — Figma confirmation before styling:**
- Call `get_metadata` / `get_design_context` on the file to check if a matching component exists in Figma.
- **If it exists:** State which Figma node/component will be used and confirm the implementation will follow it pixel-for-pixel. Do NOT describe colors or spacing in text — just confirm "will follow Figma node [name / ID]".
- **If it does NOT exist:** Render a minimal HTML/CSS mockup using existing design tokens that shows the proposed component. Present this to the engineer for approval. Do NOT proceed to implementation until the engineer approves. Once approved, the engineer adds it to Figma and tells the agent the new node ID/name. The agent then re-runs `get_design_context` on that node to confirm it landed, and only then continues with the plan. Never write a new component without this confirmation step.

**(c) A validation section** — how to confirm the output is correct. Pick whichever applies and use the most concrete option available:
- **Tests written by the agent** — use when logic is unit-testable and tests give more signal than UI steps. If chosen, write test file(s) as the very first step after plan approval (before any feature code), run to confirm failure, implement, then confirm pass. Include the test file path and run command in the plan.
- **Automated checks** — exact commands to run (`npx tsc --noEmit`, `npm run lint`, specific test commands) with expected pass criteria
- **Manual UI verification** — use when the change is best confirmed visually. Step-by-step through the running app (e.g. "1. `npm run dev`, 2. click X, 3. expect Y to appear"), each step with the expected observable result
- **Self-validation by the agent** — when the agent can verify itself (e.g. running `npx tsc --noEmit` and reading output, taking a screenshot and comparing to Figma, calling an IPC method and inspecting the response), say so explicitly so the user knows no manual step is needed

**Every approach must include a "what wrong looks like" signal** — at least one specific failure mode the engineer can spot a regression by, not just a happy-path pass.

Choose the approach that gives the most signal for this specific change — tests for logic-heavy work, UI steps for visual/interaction work. Mix approaches when both are needed. If agent-written tests are chosen, follow test-first order: write tests → confirm fail → implement → confirm pass.

Never produce a plan without a validation section — even one-line tasks get a one-line validation step.

### 7. Commit message style
- Format: `<type>: <brief summary of what was done>` — e.g. `feat: add 3-column app shell layout (PLAN 1.1)`
- Allowed types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`
- Applies to **every** commit, including merge commits into `main` — never use `merge: …` as the type. Pass `-m "<type>: <summary>"` to `git merge` directly (see §10) so the merge commit lands with the right subject; do not rely on amending after the fact.
- Keep the subject under ~70 chars; put any extra context in the body.

### 8. Post-implementation verification

Immediately after finishing any implementation, run every verification step listed in the task plan — do not wait for the user to ask.

- If the task plan includes agent-written tests, those were already written before implementation (§6c). Run them now and confirm they pass.
- Execute each step in order; if a step fails, diagnose and fix the issue, then re-run **from the first failing step**.
- **Never modify or remove a verification step** to make it pass — only fix the underlying code. If a verification step appears wrong, flag it to the engineer and wait for permission before changing it.
- **Loop budget:** retry the same failing step at most **3 times**. If it still fails after 3 attempts, or if you cannot identify the root cause, stop and report what was tried and what's still broken — do not keep looping. The engineer will decide whether to continue.
- Once all steps pass, attach the proof per §5 (test output, type-check summary, screenshot for UI tasks) in the response.

### 9. Cleanup task

`cleanup task` is the **final** step in the workflow — it must run *after* `merge to main` or `create PR` (§10). It never merges anything itself.

When the engineer prompts **"cleanup task"**, the agent must:

0. **Run the preflight script as a hard gate** — `bash .claude/hooks/preflight-cleanup.sh`. If it exits nonzero, stop and report stderr. Do not bypass.
1. **Verify done criteria** (§5) — confirm the agent already executed every verification step in the task plan and all passed (per §8). This includes `npx tsc --noEmit`, `npm run lint`, any agent-written tests, UI verification steps, and screenshots if required. Also confirm the task plan checkbox in `docs/PLAN.md` is marked `[x]` and a commit for this task exists on the branch. Do not re-run steps here — verify they were completed; if any were skipped, run them now.
2. **Verify §10 already happened** — the branch must be either:
   - Already merged into `main` on origin (`git branch -r --merged origin/main` shows the branch), OR
   - Have an open PR targeting `main` (`gh pr list --head <branch>` returns one).

   If neither is true, refuse cleanup and tell the engineer to run `merge to main` or `create PR` first.
3. **If any criterion fails** — report what failed. Do NOT proceed with cleanup.
4. **If all criteria pass:**
   - Remove the git worktree: `git worktree remove <path> --force`
   - Delete the local branch: `git branch -d <branch>` (only if merged; if PR-only, skip and let the PR handle it)
   - Remove any task-specific temp files created during this task only.
   - Report completion.
5. **Scope guard:** Only touch artifacts whose path is *inside* the current worktree directory, or whose name contains the worktree name (e.g. `/tmp/<worktree-name>-*`). Never delete files outside the worktree path, branches not belonging to this worktree, or files not created during this task.

### 10. Merge to main / Create PR

Two commands the engineer can invoke after a task is complete:

**"merge to main"** — merges the current branch directly into `main`.
**"create PR"** — opens a pull request from the current branch to `main`.

Both follow the same pre-flight sequence before doing anything. The agent runs **all of this from inside the current feature worktree** — never `cd` into the main worktree until step 4a explicitly says to.

1. **Fetch main** — `git fetch origin main` (no checkout — stay on the feature branch).
2. **Rebase feature branch onto fresh main** — `git rebase origin/main`. If conflicts arise, resolve them file-by-file, stage the resolutions, and continue (`git rebase --continue`). Do not `--abort` without telling the engineer first.
3. **Re-run all verification steps from the task plan** after the rebase (§5/§8) — a clean rebase can still break things.

Then:
- **"merge to main"** → `git push --force-with-lease origin <branch>` (since rebase rewrote history), then in the **main worktree**: `git checkout main && git pull origin main && git merge --no-ff <branch> -m "<type>: <summary> (PLAN X.Y)" && git push origin main`. Use §7 commit style. Extract `X.Y` from the branch name (`task/X.Y-...` per §4).
- **"create PR"** → `git push --force-with-lease origin <branch>`, then `gh pr create --base main --head <branch> --title "<type>: <summary> (PLAN X.Y)" --body "..."` — include a short description and a link to the relevant PLAN.md item. Extract `X.Y` from the branch name.

After either command succeeds, report the merge commit hash or PR URL. The engineer typically runs `cleanup task` (§9) next.

---

## Quick stack reference

| | |
|---|---|
| Language | TypeScript strict — `.ts` / `.tsx` only |
| Shell | Electron + React 18 + Vite (`electron-vite`) |
| AI | Claude Code CLI via `child_process` — no API key, no SDK |
| Excel | Univer (`@univerjs/presets`) + SheetJS in main |
| Word | SuperDoc (`@superdoc-dev/react`) — AGPLv3, license TBD |
| PowerPoint | `pptxtojson` + custom renderer — Milestone 4, not started |
| State | Zustand (`workspaceStore` only for now) |
| Styling | CSS Modules + `src/styles/tokens.css` |

---

## Figma

**File key:** `LDB6iIV2fbzIsD3NLNDMVE`

When the Figma MCP is connected, always use it before any UI work. Do not ask the user for the file key — it is above.

### How to find the right node
- If the user names a screen or component, call `get_metadata` on the file to find the matching node ID, then call `get_design_context` on it
- If the user provides a Figma URL with a node ID, extract it directly from the URL

### MCP workflow — follow this order every time
1. `get_design_context(fileKey, nodeId)` — structured design + code output
2. If response too large: `get_metadata` first to get node map, then re-fetch needed nodes
3. `get_screenshot(fileKey, nodeId)` — visual reference
4. Check `src/components/ui/` — reuse existing component before building new
5. Translate to project conventions:
   - Tailwind classes → CSS Module classes referencing `tokens.css`
   - Hardcoded hex/px → token variables
   - Inline `style={{}}` → CSS module class
6. Validate rendered output against screenshot before marking done

---

## UI & Styling rules

### Components
- All UI components: `src/components/ui/` — check here first
- Feature components: `src/components/`
- Each component: own folder — `src/components/ui/Button/index.tsx` + `Button.module.css`
- Named exports only: `export function Button(...)`

### Design tokens (`src/styles/tokens.css`)
- Colors: `--color-brand-primary`, `--color-neutral-*`, `--color-semantic-*`
- Typography: `--font-size-sm`, `--font-size-md`, `--font-weight-regular`, `--line-height-*`
- Spacing: `--space-1` (4px), `--space-2` (8px), `--space-3` (12px), `--space-4` (16px), `--space-6` (24px), `--space-8` (32px)
- Radius: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full`
- Shadows: `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- Light/dark mode via `prefers-color-scheme` — never hardcode dark/light values
- If `src/styles/tokens.css` does not exist, create it before any component work

### Assets
- Figma MCP `localhost` image/SVG → use directly, no substitution
- No new icon packages — use Figma MCP payload or existing `src/assets/icons/`
- Images → `src/assets/images/`, icons → `src/assets/icons/`

### Electron UI rules
- No `window.alert` / `window.confirm` / `window.prompt` — use Dialog components
- Traffic-light buttons: `padding-top: 28px` on any full-window top bar
- Persist preferences via `electron-store` — not `localStorage`

---

## Development commands

```bash
npm run dev        # Start Electron app in development mode (hot-reload)
npm run build      # Production build → out/
npm run preview    # Preview the production build
npm run lint       # Run ESLint across all .ts/.tsx files
npm run lint:fix   # Auto-fix lint issues
npm run format     # Run Prettier on src/ and electron/
```

TypeScript is checked by the build tools — there is no separate `tsc` watch script. To run a one-off type check:

```bash
npx tsc --noEmit
```
