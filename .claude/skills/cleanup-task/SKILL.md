---
name: cleanup-task
description: >
  Final step in the workflow. Verify §5 done criteria AND that "merge to main"
  or "create PR" already ran, then remove the worktree, branch, and task-only
  temp files. Never merges anything itself. Scope-guarded.
---

# Cleanup Task

Invoke when the user prompts "cleanup task".

## Step 1 — Run preflight (mandatory hard gate)

```bash
bash .claude/hooks/preflight-cleanup.sh
```

If the script exits **nonzero**, STOP. Report the exact stderr output to the engineer and do not proceed. Preflight enforces §5 (tsc, lint, PLAN.md checkbox) and §10 (branch merged or PR open). Do not bypass.

If the script exits 0, proceed to Step 2.

## Step 2 — Clean up

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
