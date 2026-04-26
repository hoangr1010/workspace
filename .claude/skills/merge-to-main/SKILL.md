---
name: merge-to-main
description: >
  Pre-flight: pull main, rebase feature branch, fix conflicts, verify done
  criteria. Then either merge directly to main or open a PR depending on
  which command the engineer used.
---

# Merge to Main / Create PR

Invoke when the engineer says **"merge to main"** or **"create PR"**.

**Run all pre-flight steps from inside the current feature worktree.** Do NOT `cd` to the main worktree until step 4a explicitly says so.

The current branch should follow the `task/X.Y-<kebab-name>` convention (§4). Extract `X.Y` from the branch name to use as the PLAN ID in the merge commit subject and PR title:

```bash
branch=$(git branch --show-current)
plan_id=$(echo "$branch" | sed -nE 's|^task/([0-9]+\.[0-9]+)-.*|\1|p')
# plan_id is now "1.5" for branch "task/1.5-tab-bar"
```

## Step 1 — Fetch main (no checkout)

```bash
git fetch origin main
```

Stay on the feature branch.

## Step 2 — Rebase feature branch onto fresh main

```bash
git rebase origin/main
```

If conflicts occur:
- Resolve each file manually (do not discard changes without reading them).
- Stage: `git add <file>`
- Continue: `git rebase --continue`
- Repeat until clean. Never `git rebase --abort` without telling the engineer.

## Step 3 — Re-run all verification steps from the task plan

A clean rebase can still break things. Run every step listed in the task plan (§5/§8), not just tsc/lint. If any fail, fix before proceeding.

## Step 4a — Merge to main (command: "merge to main")

Rebase rewrote history, so push the feature branch with `--force-with-lease`, then do the merge from the main worktree:

```bash
# In the feature worktree:
git push --force-with-lease origin <feature-branch>

# Then in the main worktree:
git checkout main
git pull origin main
git merge --no-ff <feature-branch> -m "<type>: <summary> (PLAN X.Y)"
git push origin main
```

Use §7 commit style. Report the merge commit hash.

## Step 4b — Create PR (command: "create PR")

```bash
git push --force-with-lease origin <feature-branch>
gh pr create \
  --base main \
  --head <feature-branch> \
  --title "<type>: <summary>" \
  --body "$(cat <<'EOF'
## What
<1-2 sentences describing what the task does>

## Plan item
PLAN.md: X.Y

## Verification
All verification steps from the task plan passed.
EOF
)"
```

Report the PR URL. The engineer typically runs `cleanup task` next.
