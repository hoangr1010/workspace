---
name: cleanup-task
description: >
  Final step in the workflow. Verify §5 done criteria AND that "merge to main"
  or "create PR" already ran, then remove the worktree, branch, and task-only
  temp files. Never merges anything itself. Scope-guarded.
---

# Cleanup Task

Invoke when the user prompts "cleanup task".

## Step 0 — Run preflight script (mandatory hard gate)

Before doing anything else, run:

```bash
bash .claude/hooks/preflight-cleanup.sh
```

If the script exits **nonzero**, STOP. Report the exact stderr output to the engineer and do not proceed to any later step. The script enforces §5 (tsc, lint, PLAN.md updated, commit on branch) and §10 (branch merged or PR open). Do not attempt to bypass it.

If the script exits 0, continue to Step 1.

## Step 1 — Verify done criteria (§5)

Confirm the agent already executed every verification step in the task plan and all passed (per §8). Do not re-run; verify they were completed. If any were skipped, run them now.

Required to pass:
- `npx tsc --noEmit` exited 0
- `npm run lint` exited 0
- All task-plan verification steps ran and passed (tests, UI steps, screenshots)
- The task checkbox in `docs/PLAN.md` is `[x]`
- A commit for this task exists on the branch (`git log --oneline -5`)

## Step 2 — Verify §10 already happened

The branch must be either merged into `main` on origin OR have an open PR:

```bash
git fetch origin main
git branch -r --merged origin/main | grep <branch>   # merged?
gh pr list --head <branch>                            # open PR?
```

If neither is true, **refuse cleanup**. Tell the engineer to run "merge to main" or "create PR" first.

## Step 3 — Report pass/fail

If any check fails, output a summary and stop.

## Step 4 — Clean up (only if all pass)

```bash
git worktree list
git branch --show-current
```

Then:
1. Remove this worktree: `git worktree remove "<worktree-path>" --force`
2. Delete the local branch — only if merged. If PR-only, skip and let the PR handle it: `git branch -d <branch-name>`
3. Remove temp/scratch files whose path is inside the worktree, or whose name contains the worktree name (e.g. `/tmp/<worktree-name>-*`).

## Scope guard

**NEVER** delete:
- Files outside the current worktree path
- Branches not belonging to the current worktree
- Any file you did not create during this task
- `main` or any protected branch

If unsure whether something belongs to this task, skip it and tell the engineer.

## Final report

- Worktree removed: path
- Branch deleted: name (or "skipped — PR open")
- Temp files removed: list (or "none")
