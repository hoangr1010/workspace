// PLAN 2.2 / 2.3 / 2.4 — Claude Code CLI integration
//
// ⚠️ The "Claude Code CLI integration" section in docs/architecture.md is
// marked NOT REVIEWED. Do not implement the bodies below until that section
// is finalized — see CLAUDE.md §4.

export async function checkClaudeCli(): Promise<{
  installed: boolean;
  version: string | null;
  authenticated: boolean;
}> {
  throw new Error('PLAN 2.2 — checkClaudeCli not implemented (architecture section not reviewed)');
}

export async function askClaude(args: {
  message: string;
  fileContext: Record<string, string>;
}): Promise<{ message: string; changes: readonly unknown[] }> {
  throw new Error(
    `PLAN 2.3 — askClaude not implemented (architecture section not reviewed). files: ${Object.keys(args.fileContext).length}`
  );
}
