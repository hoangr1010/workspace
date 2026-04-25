#!/bin/bash
# Fires after Write/Edit on a UI component file.
# If the component's name is not mentioned in the design-system skill,
# pings the developer to document it in Figma + SKILL.md.

set -e

input=$(cat)
file=$(echo "$input" | jq -r '.tool_input.file_path // .tool_response.filePath // empty' 2>/dev/null)

[ -z "$file" ] && exit 0

# Only care about files under src/components/ (jsx/tsx/css/module.css).
case "$file" in
  *src/components/*.jsx|*src/components/*.tsx|*src/components/*.css) ;;
  *) exit 0 ;;
esac

# Extract the component name: the folder name that sits under
# src/components/ui/<Name>/... or src/components/<Name>/..., falling back to
# the filename (sans extension) if the file sits directly under src/components.
name=$(echo "$file" | sed -n \
  -e 's|.*/src/components/ui/\([^/]*\)/.*|\1|p' \
  -e 's|.*/src/components/\([^/]*\)/.*|\1|p')

if [ -z "$name" ]; then
  name=$(basename "$file")
  name="${name%.module.css}"
  name="${name%.*}"
fi

# Skip uninteresting bases
case "$name" in ''|index|App|main) exit 0 ;; esac

# Locate the skill file (project-relative)
skill=".claude/skills/design-system/SKILL.md"
[ ! -f "$skill" ] && exit 0

# Normalize both the component name and the skill contents to lowercase
# alphanumerics only, so "File Chip" / "FileChip" / "file-chip" all match.
norm() { tr '[:upper:]' '[:lower:]' | tr -cd '[:alnum:]'; }
nm=$(printf '%s' "$name" | norm)
sk=$(norm < "$skill")

case "$sk" in
  *"$nm"*) exit 0 ;;   # already documented
esac

# Not documented — ping the developer.
jq -n --arg n "$name" '{
  systemMessage: (
    "⚠ New UI component `" + $n + "` is not in the design system.\n\n" +
    "Before shipping, add it in TWO places:\n" +
    "  1. Figma — add a component frame to file LDB6iIV2fbzIsD3NLNDMVE " +
       "(page `design system`, Components group at node 94:2). Include its canonical size, padding, radius, and token-bound colors.\n" +
    "  2. Skill — append a spec section to .claude/skills/design-system/SKILL.md with the same prop table format used by the existing 11 components (Button, File Chip, Diff Card, etc.).\n\n" +
    "The design system is the source of truth — an undocumented component is an untracked one."
  )
}'
