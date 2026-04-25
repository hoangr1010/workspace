---
name: design-tokens
description: Use when designing or building UI for the AI Workspace app (Electron/React office-AI tool) — picking colors, spacing, typography, radii, or borders from its Claude-clay design system, or when extending the Figma "AI Workspace" variable collection. Applies to code (CSS/JSX in `src/`) and Figma design work. Skip for unrelated projects.
---

# AI Workspace Design Tokens

Every token in the AI Workspace design system is semantic — not decorative. Picking the "right" token is about intent, not aesthetics. This guide tells you which token matches which intent, and forbids the common mis-uses.

## Core principles

These three rules override any token-level choice. When in doubt, fall back to them:

1. **Warm, not cold** — surfaces are brown-black, text is cream. Never reach for a blue-black neutral, never pure white. If the workspace starts to feel like chrome/glass, you picked the wrong surface.
2. **Hairlines over shadows** — separation = `0.5px border` + one step on the surface ladder. No drop shadows except on the mac window outer frame.
3. **Accent earns amber** — `accent/*` is reserved for AI authorship, AI-pending state, or user-initiated AI intent. Never decorative. If the thing isn't AI-related, pick a neutral.

## Token source

- **CSS** — `src/styles/tokens.css` (CSS custom properties, `--bg-outer` etc.)
- **Figma** — Variable collection `AI Workspace`, modes `Dark` / `Light`
- **Spec** — `Design System.html` in the project bundle is the source of truth. If CSS and Figma disagree, the spec wins.

Token names match 1:1 between CSS and Figma. Figma uses `/` (e.g. `bg/surface`), CSS uses `-` (e.g. `--bg-surface`).

## Surfaces — the 6-step ladder

Use in this **outer→inner** order for depth. Each surface is ±1 stop from its neighbors; don't skip steps.

| Token | Hex (dark) | Use for | NEVER use for |
|---|---|---|---|
| `bg/outer` | `#1a1917` | Mac-window outer frame (the gutter behind everything) | Any interior panel |
| `bg/chrome` | `#1f1e1c` | Title bar, tool rail, tab bar inactive area | Content panes |
| `bg/surface-2` | `#221f1d` | File tree, xlsx column header — panels that should *recede* slightly from the main pane | The primary content area (use `bg/surface`) |
| `bg/surface` | `#262624` | Primary content pane, active tab body, chat panel, viewers | Deeply-nested cards (step up to surface-3) |
| `bg/surface-3` | `#2b2a27` | Diff cards, xlsx total rows — lifted one step from the content pane | Small inline chips (use `bg/raised`) |
| `bg/raised` | `#30302d` | Chips, sheet tabs, pptx filmstrip slides, input backgrounds | Big panels (too bright) |

**Common mistake:** using `bg/raised` for a whole panel because "it's lighter and feels active." Panels are `bg/surface-2` or `bg/surface`. Raised is for *small* elements.

**Decision:** to elevate content visually, walk up the ladder one step — don't add a shadow or a heavier border.

## Text ramp — 12 shades, by role

The ramp is continuous. You almost never need exact middle values — pick the role, not the brightness.

| Token | Role | Concrete examples |
|---|---|---|
| `text/text` | Maximum emphasis | Rare — only for display headings in special surfaces |
| `text/high` | Active tab label, headings in title bar | "Design System" h1, active tab |
| `text/high-2` | File names, card titles, selected tree row | `Brief_v2.docx` in tree when selected |
| `text/body` | Default body | Chat messages, viewer body copy |
| `text/body-2` | Ghost button label, secondary body | `Reject` button, sub-messages |
| `text/body-3` | Tokens, tree rows default (unselected) | `=SUM(B2:B12)`, inactive file names |
| `text/mid` | Timestamps, inactive tab label, captions | "Modified 2h ago", chat author name |
| `text/mid-2` | Secondary labels | Sheet tab text |
| `text/muted` | Placeholder, disabled control | Composer placeholder |
| `text/subtle` | Kicker labels (ALL CAPS) | `WORKSPACE`, `FILES`, section numbers |
| `text/faint` | Idle rail icons, chevrons, grip dots | Left-rail icons (not hovered) |
| `text/fainter` | Ghost/strikethrough text, trace separators | Removed diff line text background |

**Rules:**
- Start at `text/body` and step up for emphasis or down for de-emphasis.
- Body copy never below `12.5px` regardless of which token you pick.
- Kickers (`text/subtle` + `ALL CAPS` + `+0.5–0.8px` letter-spacing + weight 600) are the only place uppercase is allowed.

**Common mistake:** using `text/high` for body. That's display-only. Body is `text/body`.

## Accent — Claude clay (`accent/*`)

The only non-neutral hue in the system. Treat it as a scarce resource.

| Token | Hex (dark) | Use for |
|---|---|---|
| `accent/default` | `#d97757` | Primary button fill, pending dot, Claude avatar, send button (when composer non-empty) |
| `accent/dark` | `#b85f3f` | Primary button hover |
| `accent/dark-2` | `#9e4f32` | Primary button active/pressed |
| `accent/light` | `#e89878` | Rare — decorative highlight in the spec itself (top of accent strip) |
| `accent/contrast` | `#1a1200` | Text/icons ON accent fills (primary button label) |

**ALLOWED uses:**
- Claude avatar in chat
- Pending dot on tab / tree row (signals AI change awaiting review)
- Send button when composer is non-empty
- Workspace "A" brand chip
- Principle number / masthead kicker — but *only inside the Design System spec doc*

**NEVER use accent for:**
- Bulk body text
- Hover states on unrelated elements
- Decorative borders
- Links (use `text/body` with underline, or `text/high-2`)
- "Adding life" to a dead-looking layout — the layout is the problem, not the color

**Red flag:** if you find yourself reaching for accent because something looks "flat," stop. Either (a) it's meant to be flat, or (b) use the surface ladder.

## Semantic colors

All desaturated so they read as information, not decoration.

| Token | Hex | Use exclusively for |
|---|---|---|
| `semantic/diff-add` | `#7ee5a3` | Inserted text/cell/line in a diff view |
| `semantic/diff-remove` | `#e0604a` | Struck-through / removed content |
| `semantic/ok` | `#3ecf8e` | Approve buttons, "all clear" states |
| `semantic/warn` | `#f4b93b` | Unsaved, needs-attention badges |
| `semantic/err` | `#f87171` | Destructive actions, rejection, failure |

**Rules:**
- Never use semantic colors outside of information states. A green divider = wrong.
- Diff colors are paired with 2px left-border in the same hue and a ~6–8% background tint.
- `semantic/ok` ≠ `type/xls` (same hex coincidentally — context differs). Pick by meaning.

## File-type hues (`type/*`)

Used in file icons, chips, and tree type letters.

| Token | Hex | For files ending in |
|---|---|---|
| `type/xls` | `#3ecf8e` | `.xlsx`, `.xls` (Excel) |
| `type/doc` | `#6ea8fe` | `.docx`, `.doc` (Word) |
| `type/ppt` | `#f5a623` | `.pptx`, `.ppt` (PowerPoint) |

**Never** use these outside file-type indication.

## Borders — hairlines only

Borders are always **0.5px** in this system. If you need something heavier, you're wrong.

| Token | Hex | Use for |
|---|---|---|
| `border/hairline` | `#332f2b` | Row separators inside cards/tables |
| `border/default` | `#3a3632` | Standard card/panel borders |
| `border/strong` | `#4a4540` | Hover/focus elevated border |

**Rules:**
- Always `0.5px`. Never `1px`, never `2px` (except the 2px diff-line left-border).
- Dashed borders are for placeholders only (demo areas in spec doc). Not for production UI.
- Focus ring is `2px rgba(var(--accent-rgb), 0.35)` with offset 0 — this is NOT a border token.

## Spacing — 4-based scale

Only use these values. No in-between numbers.

| Token | px | Typical use |
|---|---|---|
| `spacing/space-0` | 2 | Hairline gap inside icon groups |
| `spacing/space-1` | 4 | Tight icon-to-text, pill internal |
| `spacing/space-2` | 6 | Tab internal, icon-to-label in rail |
| `spacing/space-3` | 8 | Tree-row internal, button icon+text gap |
| `spacing/space-4` | 12 | Card internal gap, tab horizontal padding |
| `spacing/space-5` | 16 | Default panel padding (chat, viewer body) |
| `spacing/space-6` | 20 | Card gutter, section heading gap |
| `spacing/space-7` | 24 | Region gap between columns |
| `spacing/space-8` | 32 | Major section separation |
| `spacing/space-9` | 48 | Top-level page chrome only |

**Rule:** if your design needs `10px` or `18px` or `40px`, the design is wrong — not the scale. Round to the nearest token.

## Canonical sizes

These are fixed. Don't "improve" them.

| Token | px | What |
|---|---|---|
| `size/tool-rail` | 52 | Left tool rail width (fixed) |
| `size/file-tree` | 256 | File-tree panel width (fixed, not resizable) |
| `size/chat-panel` | 380 | Chat / any side panel width |
| `size/title-bar` | 38 | Mac window title bar height |
| `size/tab-bar` | 36 | Tab bar height (active tab sits 34px inside) |
| `size/row` | 28 | Tree row, list row height (dense default) |
| `size/btn-sm` | 28 | Small button height |
| `size/btn-md` | 32 | Medium button height (minimum for ≥13px labels) |

**Rule:** never go below 26px tall for a clickable target.

## Radii — the 2-4-6-8 ladder

| Token | px | Use for |
|---|---|---|
| `radius/xs` | 2 | Code chips, inline diff backgrounds |
| `radius/sm` | 3 | Inline pills |
| `radius/base` | 4 | File chips, small buttons |
| `radius/md` | 5 | Standard buttons, list rows |
| `radius/lg` | 6 | Small cards (diff card) |
| `radius/xl` | 8 | Panels, larger cards, tabs (top corners only) |
| (full circle) | 9999 in CSS / `50%` in Figma | Avatars, dots (no token — use the raw value) |

**Common mistake:** 4px everywhere because it looks "safe." Buttons use 5px (`radius/md`), not 4px. Panels use 8px (`radius/xl`), not 6px.

## Typography (no token, but rules)

Two families only:

- `--sans` → `Inter` (all UI text)
- `--mono` → `SF Mono` / `JetBrains Mono` (tokens, cell refs, formulas)

**Size scale:**
| Role | Size / line-height / weight |
|---|---|
| display | 24 / 1.15 / 500 |
| h1 / panel | 18 / 1.3 / 500 |
| h2 / file title | 15 / 1.3 / 500 |
| ui label | 13 / 1.4 / 500 |
| body | 13 / 1.55 / 400 |
| ui tight | 12.5 / 1.4 / 450 |
| caption | 11.5 / 1.4 / 400 |
| kicker | 10.5 / 1 / 600 / ALL CAPS / +0.5–0.8px |
| mono / token | 11.5 / 1.4 / 400 |

**Rules:**
- Body never below 12.5px.
- Weights allowed: 400, 450, 500, 600. **No 700.**
- Line-height: 1.5 for paragraphs, 1.3–1.4 for UI, 1 for single-line pills.

## Motion

| Token | Duration | Easing | Use for |
|---|---|---|---|
| `motion-micro` | 80ms | ease-out | Hover color fade |
| `motion-short` | 120ms | ease-out | Background fade, opacity in |
| `motion-base` | 180ms | `cubic-bezier(.4, 1.3, .5, 1)` | Toggle knob, tab focus |
| `motion-theme` | 200ms | ease | Theme switch fade |

**Rules:**
- Transition ONLY `color`, `background`, `opacity`, `transform`. Never `all`.
- Never animate layout properties (`height`, `width`, `top`, `left`).
- No parallax, no scroll-linked motion, no decorative loops.

## Light mode

Dark and light share 1:1 token names. **Never** branch on theme at the component level — always read the token and let the mode swap values.

```css
/* ✅ correct */
.card { background: var(--bg-surface); }

/* ❌ wrong */
.card { background: var(--bg-surface); }
@media (prefers-color-scheme: light) {
  .card { background: #fff; }  /* don't! the token already handles this */
}
```

## Common mis-uses — red flags

If you catch yourself doing any of these, stop:

| Symptom | Fix |
|---|---|
| Reaching for a hex value not in the token list | Pick the closest token. If there's no close token, your design is wrong — not the system. |
| Using `accent/*` for hover on a non-AI element | Use `border/strong` or a 4% white overlay (`rgba(250,249,245,0.05)`). |
| Using `1px` or `2px` border | Make it `0.5px`. Visual weight comes from surface ladder, not stroke width. |
| Using `text/high` for body | Body is `text/body`. High is display-only. |
| Using any box-shadow | Remove it. Depth is surface ladder + hairline. |
| Creating a new color "just for this one place" | Re-read the principles. The system is the answer, not the exception. |
| Using `semantic/ok` for a decorative green | Pick a neutral. Semantic = information only. |
| Freely mixing 10, 14, 18px paddings | Round to the spacing scale: 8, 12, 16, 20. |

## Figma-specific notes

- The `AI Workspace` collection has two modes: **Dark** (default) and **Light**. Attach variables via binding, not raw color pickers.
- Always set `scopes` explicitly when adding new variables. Colors get `FRAME_FILL`/`SHAPE_FILL`/`TEXT_FILL`/`STROKE_COLOR` as appropriate — never `ALL_SCOPES`.
- Canonical sizes (`size/*`) use scope `WIDTH_HEIGHT`. Spacing uses `GAP` + `WIDTH_HEIGHT`. Radii use `CORNER_RADIUS`.
- Do NOT add new top-level tokens without extending the spec first. If a design need isn't covered, the spec needs updating — don't quietly add `bg/surface-4`.

## Quick decision flow

- **Picking a background?** → walk the surface ladder from outer to inner. Which ring am I in?
- **Picking text color?** → start at `text/body`, step up/down by role.
- **Picking a border?** → always `0.5px`. Just pick the right hairline/default/strong.
- **Picking a size?** → is it on the spacing scale? If not, round to it.
- **Using accent?** → is this AI authorship/intent/pending? If no, pick a neutral.
- **Using a semantic color?** → is this informational (add/remove/ok/warn/err)? If no, pick a neutral.
