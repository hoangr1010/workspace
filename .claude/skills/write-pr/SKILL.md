---
name: write-pr
description: >
  Writes a PR description for the current branch. Produces exactly the
  information the pr-review agent needs to verify the PR — no more, no less.
  Invoke when the engineer says "write PR description" or "write the PR body".
---

# Write PR Description

Invoke when the engineer asks to write or draft a PR description.

The goal is a description that is **complete enough for the `pr-review` agent to run unassisted** and **short enough that nothing is redundant**.

## Step 1 — Collect context

Run these to understand what changed:

```bash
git diff origin/main...HEAD --stat
git log origin/main..HEAD --oneline
```

Read the changed files to understand:
- What the code does now that it didn't before
- What could break (type errors, regressions, IPC contracts, UI changes)

## Step 2 — Identify all verification steps

For each category below, decide if it applies to this PR. Include it only if it does.

| Category | When to include | Example command |
|---|---|---|
| TypeScript | Any `.ts`/`.tsx` changed | `npx tsc --noEmit` |
| Lint | Any source file changed | `npm run lint` |
| Tests | Test files exist or changed | `npm test` |
| Build | Entry points or config changed | `npm run build` |
| IPC contract | `src/types/ipc.ts` or handlers changed | manual: verify channel names match on both sides |
| UI / visual | React components or CSS changed | manual: describe exactly what to open and what to look for |
| Shortcuts | `electron/main.ts` accelerators changed | manual: press the key, confirm the action |

Do not include a category if no changed file touches it.

For manual steps, write a single, specific action and the expected result — not a vague "check the UI".

**Bad:** `- [ ] Open the app and check it works`
**Good:** `- [ ] Open a `.xlsx` file → tab bar shows filename with no dirty indicator`

## Step 3 — Write the description

Use exactly this structure. Omit any section that has nothing to say.

```markdown
## Summary
<One sentence: what this PR does and why.>

## Changes
- <file or area>: <what changed, one line each>

## Test plan
- [ ] <automated command>
- [ ] <automated command>
- [ ] <manual: specific action → expected result>
```

### Rules

- **Summary** — one sentence, no bullet points. State the behaviour change, not the implementation.
- **Changes** — one line per logical area. Skip files that are trivially obvious (e.g. listing every CSS module). Group related files.
- **Test plan** — ordered from fastest to slowest: automated commands first, manual steps last. Each item is a checkbox (`- [ ]`). Automated items must be runnable as-is (no placeholders). Manual items must name the exact UI element and the expected observable result.
- No "motivation", "background", or "future work" sections — those belong in commits or PLAN.md.
- No line should restate another line.
