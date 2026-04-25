---
name: design-system
description: Use when building, placing, or modifying any of the 11 UI components in this app — Button (primary/ghost/approve/reject), File Chip, Pending Dot, Diff Card, Tree Row, Active Tab, Inactive Tab, or Chat Message. Covers their exact sizes, paddings, radii, and colors.
---

# Components

Canonical spec for the 11 components in Figma frame [node 94:2](https://www.figma.com/design/LDB6iIV2fbzIsD3NLNDMVE/des-sys?node-id=94-2). Match these numbers exactly — the component set is small and every size is fixed.

## Button / Primary

Commits an AI action. **Max one per view.**

| prop | value |
|---|---|
| background | `var(--accent)` |
| color | `var(--accent-contrast)` |
| height | 28 px |
| padding | 6 × 14 |
| radius | 5 px |
| font | 12.5 px / 500 |
| gap (icon + text) | 6 px |

## Button / Ghost

Default action. Secondary intent, reject, cancel.

| prop | value |
|---|---|
| background | transparent |
| color | `var(--text-body-2)` |
| border | 0.5 px `var(--border)` |
| height | 28 px |
| padding | 6 × 14 |
| radius | 5 px |
| font | 12.5 px / 400 |
| hover bg | `rgba(var(--accent-rgb), 0.04)` |

## Button / Approve

Inline change acceptance on diff cards.

| prop | value |
|---|---|
| background | `rgba(62, 207, 142, 0.10)` |
| color | `var(--ok)` |
| border | 0.5 px `rgba(62, 207, 142, 0.30)` |
| padding | 4 × 10 |
| radius | 4 px |
| font | 11 px / 400 |

## Button / Reject

Inline change dismissal on diff cards.

| prop | value |
|---|---|
| background | transparent |
| color | `var(--text-mid)` |
| border | 0.5 px `var(--border)` |
| padding | 4 × 10 |
| radius | 4 px |
| font | 11 px / 400 |

## File Chip

File reference in chat, composer, or trace.

| prop | value |
|---|---|
| background | `var(--bg-raised)` |
| border | 0.5 px `var(--border)` |
| padding | 3 × 9 |
| radius | 4 px |
| font | 11.5 px / 400 |
| color | `var(--text-body-3)` |
| dot size | 6 px |
| dot color | `var(--type-xls)` / `--type-doc` / `--type-ppt` |
| gap | 6 px |

## Pending Dot

Signals a file has AI changes awaiting review.

| prop | value |
|---|---|
| size | 6 × 6 px |
| background | `var(--accent)` |
| shape | full-circle (radius 50%) |
| gap from label | 6 px |

Appears in **4 places simultaneously** whenever a change is pending: tree row, tab, chat diff card, viewer inline.

## Diff Card

A single reviewable AI change. Add / Remove / Approve / Reject.

| prop | value |
|---|---|
| width | **280 px** (fixed) |
| background | `var(--bg-surface-3)` |
| border | 0.5 px `var(--border)` |
| radius | 6 px |
| padding | 10 × 12 |
| title | 11.5 px / 500, `var(--text-high-2)` |
| diff line font | 11 px mono |
| diff-add bg | `rgba(74, 222, 128, 0.06)` |
| diff-add color | `var(--diff-add)` |
| diff-add left-border | 2 px `rgba(74, 222, 128, 0.45)` |
| diff-rem bg | `rgba(224, 96, 74, 0.06)` |
| diff-rem color | `var(--diff-remove)` |
| diff-rem decoration | line-through |
| diff-rem left-border | 2 px `rgba(224, 96, 74, 0.45)` |
| actions gap | 8 px · 10 px top margin |

## Tree Row

File or folder in the sidebar.

| prop | value |
|---|---|
| width | **256 px** (fixed — matches file-tree column) |
| height | **28 px** |
| padding | 0 × 10 |
| gap | 6 px |
| active bg | `rgba(250, 249, 245, 0.05)` |
| radius | 5 px |
| chevron | `var(--text-faint)` 11 px |
| type letter | 10.5 px mono, `var(--type-*)` |
| filename | 12.5 px / 500, `var(--text-high)` |
| indent per level | 14 px |
| indent guide | 1 px `var(--hairline)` |

## Active Tab

Tab for the currently-viewed file.

| prop | value |
|---|---|
| height | **34 px** (4 px taller than inactive) |
| background | `var(--bg-surface)` |
| border | 0.5 px top + sides (no bottom — flush with content pane) |
| radius | 8 px top-left + top-right only |
| padding | 7 × 12 |
| font | 12.5 px / 500, `var(--text-high)` |
| gap | 8 px |

## Inactive Tab

Non-selected tabs.

| prop | value |
|---|---|
| height | **30 px** |
| background | none (shows `--bg-chrome` behind) |
| border | none |
| padding | 7 × 12 |
| font | 12.5 px / 400, `var(--text-mid)` |
| gap | 8 px |

## Chat Message

Flat — no bubbles. Author identified by avatar + name.

| prop | value |
|---|---|
| width | **380 px** (matches chat-panel column) |
| padding | 12 × 16 |
| avatar | 22 × 22 px circle, `var(--accent)` (Claude) |
| avatar → text gap | 10 px |
| name | 11.5 px / 400, `var(--text-mid)` |
| name → body gap | 4 px |
| body | 13 px / 400, line-height 155%, `var(--text-body)` |
| alignment | top-aligned (avatar to first line) |

## Rules

1. **Do not resize fixed widths.** 280 px (Diff Card), 256 px (Tree Row), 380 px (Chat Message) are canonical.
2. **Never rebuild a component.** Reuse from `src/components/ui/`. If missing, scaffold it from this spec.
3. **Accent appears only on:** Primary button, Pending Dot, Chat Message (Claude avatar). Nowhere else in these 11 components.
4. **Borders are always 0.5 px.** Never 1 px, never thicker.
5. **No drop shadows.** Separation is via surface ladder + hairlines only.
