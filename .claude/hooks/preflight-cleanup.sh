#!/bin/bash
# Preflight check for the cleanup-task skill.
# The skill MUST call this script before any destructive action and abort if it
# exits nonzero. Verifies §5 done criteria + §10 ship gate from CLAUDE.md.
#
# Usage: bash .claude/hooks/preflight-cleanup.sh
# Exit 0  → cleanup is safe to proceed
# Exit !0 → reason printed to stderr; cleanup must not run

set -u

# Resolve repo root (works in worktrees too)
ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "ERROR: not inside a git repository" >&2
  exit 1
}
cd "$ROOT"

branch="$(git branch --show-current)"
if [ -z "$branch" ] || [ "$branch" = "main" ] || [ "$branch" = "master" ]; then
  echo "ERROR: refusing cleanup — current branch is '$branch'. Cleanup must run on a feature branch." >&2
  exit 1
fi

fail=0
report() { echo "✗ $1" >&2; fail=1; }
warn()   { echo "! $1" >&2; }
ok()     { echo "✓ $1"; }

# §4 step 3: branch should follow task/X.Y-<kebab-name> convention.
# Extract the task ID for downstream PLAN.md cross-check.
task_id=""
if [[ "$branch" =~ ^task/([0-9]+\.[0-9]+)- ]]; then
  task_id="${BASH_REMATCH[1]}"
  ok "branch follows task/X.Y-<name> convention (task=$task_id)"
else
  warn "branch '$branch' does not follow 'task/X.Y-<name>' convention (§4) — task-checkbox cross-check skipped"
fi

# §5: tsc passes
if npx tsc --noEmit >/dev/null 2>&1; then
  ok "npx tsc --noEmit"
else
  report "npx tsc --noEmit failed"
fi

# §5: lint passes
if npm run lint >/dev/null 2>&1; then
  ok "npm run lint"
else
  report "npm run lint failed"
fi

# §5: PLAN.md task checkbox is marked [x] (current file state, regardless of which commit set it)
if [ -n "$task_id" ]; then
  if grep -E "^\s*-\s*\[x\].*\b${task_id}\b" docs/PLAN.md >/dev/null 2>&1; then
    ok "PLAN.md task $task_id checkbox is [x]"
  else
    report "PLAN.md task $task_id checkbox is NOT marked [x] — agent must mark it before cleanup"
  fi
fi

# §10: branch merged into main (remote or local) OR has an open PR
git fetch origin main >/dev/null 2>&1 || true
merged=false
has_pr=false

# Prefer remote check if origin/main exists
if git rev-parse --verify origin/main >/dev/null 2>&1; then
  if git branch -r --merged origin/main 2>/dev/null | grep -qE "(^|/)$branch\$"; then
    merged=true
  fi
fi

# Fall back to local main (covers local-only repos and post-merge state)
if ! $merged; then
  if git branch --merged main 2>/dev/null | grep -qE "^[* ]+$branch\$"; then
    merged=true
  fi
fi

if command -v gh >/dev/null 2>&1; then
  pr_count="$(gh pr list --head "$branch" --state open --json number 2>/dev/null | jq 'length' 2>/dev/null || echo 0)"
  [ "${pr_count:-0}" -gt 0 ] && has_pr=true
fi

if $merged; then
  ok "branch merged into main"
elif $has_pr; then
  ok "open PR exists for branch"
else
  report "branch '$branch' is not merged into main and has no open PR. Run 'merge to main' or 'create PR' first (§10)."
fi

if [ "$fail" -ne 0 ]; then
  echo "" >&2
  echo "Preflight FAILED — cleanup must not proceed." >&2
  exit 1
fi

echo ""
echo "Preflight OK — cleanup safe to proceed (branch=$branch)."
exit 0
