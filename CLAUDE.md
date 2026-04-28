# CLAUDE.md

Guidance for Claude Code when working in this repository.

- **Product:** [`docs/PRD.md`](docs/PRD.md)
- **Build plan & milestones:** [`docs/PLAN.md`](docs/PLAN.md)
- **Stack, architecture, IPC contract, folder structure:** [`docs/architecture.md`](docs/architecture.md)
- **Keyboard shortcuts:** [`docs/commands/shortcuts.md`](docs/commands/shortcuts.md) — every accelerator is listed here. When you add, change, or remove a shortcut in `electron/main.ts`, update this file in the **same commit**. The `check-docs.sh` hook flags commits that miss it.

---

## Workflow at a glance

```
PLAN → [engineer: "go"] → IMPLEMENT + VERIFY (loop) → [engineer: "manually review"] → SHIP → CLEANUP
```

1. **Plan (§6)** — brief overview, file changes, verification steps. **Stop and wait for "go".**
2. **Implement + Verify (§8)** — write code → run all automated verification steps → fix if failing → repeat until all pass. Automatic, no pause.
3. **Manual review** — engineer prompts `manually review`: Claude opens app and lists verification steps.
4. **Ship (§10)** — engineer prompts `merge to main` or `create PR`.
5. **Cleanup (§9)** — engineer prompts `cleanup task`.

**Human gates:** plan approval, manual review, ship, cleanup — Claude never advances past these without an explicit engineer prompt.

---

## How to work in this repo

### 1. Always plan before executing
- Before writing any code, present a plan that follows §6 in full
- **Stop after presenting the plan — do not write any code until the engineer explicitly says "go" (or equivalent)**
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
- All automated verification steps from the task plan passed
- Engineer has completed manual review (UI tasks: rendered output confirmed against Figma by engineer)
- The agent marks the corresponding checkbox in [`docs/PLAN.md`](docs/PLAN.md) as `[x]` and includes that change in the same commit. The PostToolUse `check-docs.sh` hook will surface any related `/docs` updates to make.

Do not mark a task done if any of the above fail.

### 6. Plan mode and explicit plan requests

When operating in plan mode OR when the user explicitly asks for a plan for a specific task, the response must include all of the following in order:

**(a) Overview** — 2–3 sentences or a short ASCII diagram showing data flow and what the engineer will observe.

**(b) File changes** — bullet list: `path/to/file` → what changes (one line each). Flag any unknowns or architectural decisions. For UI tasks: confirm the Figma node exists (`get_metadata` / `get_design_context`) and name it — or present a minimal HTML/CSS mockup for approval before proceeding.

**(c) Verification steps** — numbered list of exactly what to check after implement+verify. Include both automated steps (commands + expected output) and manual UI steps (click X → expect Y) as applicable.

After presenting the plan, **stop** — do not write any code until the engineer says "go".

### 7. Commit message style
- Format: `<type>: <brief summary>` — e.g. `feat: add 3-column app shell layout (PLAN 1.1)`
- Allowed types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`
- Subject line only — keep it under ~70 chars. Add brief bullet points in the body only if context is genuinely non-obvious from the diff.
- No co-author footer.
- Applies to **every** commit, including merge commits into `main` — never use `merge: …` as the type. Pass `-m "<type>: <summary>"` to `git merge` directly (see §10).

### 8. Post-implementation verification

After writing code, run the implement + verify loop automatically — no engineer prompt needed:

1. Run all automated verification steps from the task plan (tsc, lint, tests, IPC checks — whatever the plan specifies) in order.
2. If any step fails, diagnose and fix the underlying code, then re-run from the first failing step.
3. **Loop budget:** retry the same failing step at most **3 times**. If still failing after 3 attempts, stop and report what was tried — do not keep looping.
4. **Never modify or remove a verification step** to make it pass. If a step appears wrong, flag it to the engineer and wait for permission.
5. Once all automated steps pass, **stop and report results** — do not open the app, do not take screenshots. Wait for the engineer.

**On engineer prompt `manually review`:** run `npm run dev` (if not already running), then print the numbered verification steps from the plan for the engineer to work through.

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
