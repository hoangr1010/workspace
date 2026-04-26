#!/bin/bash
# Fires after a git commit bash command.
# Inspects what changed in the commit and suggests /docs updates.

input=$(cat)
cmd=$(echo "$input" | jq -r '.tool_input.command // empty' 2>/dev/null)

case "$cmd" in
  *"git commit"*) ;;
  *) exit 0 ;;
esac

changed=$(git show --name-only --format="" HEAD 2>/dev/null) || exit 0
[ -z "$changed" ] && exit 0

new_files=$(git show --diff-filter=A --name-only --format="" HEAD 2>/dev/null) || true

suggestions=""

add() {
  [ -n "$suggestions" ] && suggestions="$suggestions\n$1" || suggestions="$1"
}

seen_ipc=false
seen_handlers=false
seen_store=false
seen_package=false
seen_main=false
seen_registry=false
seen_types=false
seen_shortcuts=false

# Detect accelerator changes (added/removed/modified) anywhere in the commit.
# If the diff touches an `accelerator:` line and shortcuts.md is NOT in the
# same commit, flag it.
shortcut_changed=false
if git diff --unified=0 HEAD~1 HEAD 2>/dev/null | grep -E '^[+-][^+-].*accelerator\s*:' >/dev/null; then
  shortcut_changed=true
fi
shortcuts_doc_in_commit=false
if echo "$changed" | grep -q '^docs/commands/shortcuts\.md$'; then
  shortcuts_doc_in_commit=true
fi
if $shortcut_changed && ! $shortcuts_doc_in_commit; then
  add "• docs/commands/shortcuts.md — accelerator changed in this commit but shortcuts.md was not updated. Add/edit/remove the matching row in the same commit."
  seen_shortcuts=true
fi

while IFS= read -r f; do
  case "$f" in
    src/types/ipc.ts)
      $seen_ipc || { add "• docs/architecture.md — IPC contract: ipc.ts changed. Verify WindowApi interface docs match the current type."; seen_ipc=true; }
      ;;
    src/types/*.ts)
      $seen_types || { add "• docs/architecture.md — Shared types section: a type file changed. Check that the interface examples shown are still current."; seen_types=true; }
      ;;
    electron/main.ts|electron/preload.ts)
      $seen_main || { add "• docs/architecture.md — Process architecture: main/preload changed. Check IPC bridge and contextBridge description."; seen_main=true; }
      ;;
    electron/handlers/*.ts)
      $seen_handlers || { add "• docs/architecture.md — Process architecture / folder structure: a handler changed. Update handler descriptions, IPC flow, or folder listing as needed."; seen_handlers=true; }
      ;;
    src/store/*.ts)
      $seen_store || { add "• docs/architecture.md — State management: a Zustand store changed. Check that the store interface shown in the docs still matches."; seen_store=true; }
      ;;
    src/lib/fileRegistry.ts)
      $seen_registry || { add "• docs/architecture.md — File registry section: fileRegistry.ts changed. Verify the FileHandler interface example is still accurate."; seen_registry=true; }
      ;;
    package.json)
      $seen_package || { add "• docs/architecture.md — Stack table: package.json changed. Check if new/removed/upgraded deps need to be reflected in the stack table."; seen_package=true; }
      ;;
  esac
done <<< "$changed"

# New-file additions — structural changes warrant folder-structure updates
if [ -n "$new_files" ]; then
  new_handler=false
  new_store=false
  new_lib=false
  while IFS= read -r f; do
    case "$f" in
      electron/handlers/*.ts)
        $new_handler || { add "• docs/architecture.md — Folder structure: new handler $(basename "$f") added. Add it to the folder listing with its IPC responsibility."; new_handler=true; }
        ;;
      src/store/*.ts)
        $new_store || { add "• docs/architecture.md — State management: new store $(basename "$f") added. Document its interface in the state management section."; new_store=true; }
        ;;
      src/lib/*.ts)
        $new_lib || { add "• docs/architecture.md — Folder structure: new lib file $(basename "$f") added. Add it to the folder listing."; new_lib=true; }
        ;;
    esac
  done <<< "$new_files"
fi

[ -z "$suggestions" ] && exit 0

jq -n --arg s "$suggestions" '{
  systemMessage: ("📋 Docs check — this commit may need /docs updates:\n\n" + $s + "\n\nUpdate before the next milestone is complete.")
}'
