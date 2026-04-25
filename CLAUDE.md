# CLAUDE.md

Guidance for Claude Code when working in this repository.

- **Product:** [`docs/PRD.md`](docs/PRD.md)
- **Build plan & milestones:** [`docs/PLAN.md`](docs/PLAN.md)
- **Stack, architecture, IPC contract, folder structure:** [`docs/architecture.md`](docs/architecture.md)

---

## How to work in this repo

### 1. Always plan before executing
- Before writing any code, present a plan of what you intend to do
- Wait for explicit approval before starting
- Break work into small, reviewable chunks — never implement a large feature in one go
- One logical unit at a time (one component, one handler, one store action)

### 2. Follow the architecture exactly
- Read [`docs/architecture.md`](docs/architecture.md) before touching any file
- All decisions there are locked — do not deviate without explicit discussion
- IPC contract (`src/types/ipc.ts`) is the source of truth between main and renderer
- File paths never reach the renderer — content moves as `ArrayBuffer` or typed JSON only
- TypeScript strict mode — no `any`, no `.js`/`.jsx`, no type casts without narrowing

### 3. Follow the Figma design exactly
- **Before implementing any component or UI change, always check Figma first**
- Call `get_design_context` with the file key and node ID before writing any UI code
- Call `get_screenshot` to get the visual reference
- Never write UI without first seeing the Figma design
- Match the design pixel-for-pixel — no improvising layout, spacing, or color
- Use design tokens from `src/styles/tokens.css` — never hardcode values
- Use CSS Modules — no inline styles, no global class names

---

## Quick stack reference

| | |
|---|---|
| Language | TypeScript strict — `.ts` / `.tsx` only |
| Shell | Electron + React 18 + Vite (`electron-vite`) |
| AI | Claude Code CLI via `child_process` — no API key, no SDK |
| Excel | Univer (`@univerjs/presets`) + SheetJS in main |
| Word | SuperDoc (`@superdoc-dev/react`) — AGPLv3, license TBD |
| PowerPoint | `pptxtojson` + custom renderer — Milestone 4, not started |
| State | Zustand (`workspaceStore` only for now) |
| Styling | CSS Modules + `src/styles/tokens.css` |

---

## Figma

**File key:** `LDB6iIV2fbzIsD3NLNDMVE`

When the Figma MCP is connected, always use it before any UI work. Do not ask the user for the file key — it is above.

### How to find the right node
- If the user names a screen or component, call `get_metadata` on the file to find the matching node ID, then call `get_design_context` on it
- If the user provides a Figma URL with a node ID, extract it directly from the URL

### MCP workflow — follow this order every time
1. `get_design_context(fileKey, nodeId)` — structured design + code output
2. If response too large: `get_metadata` first to get node map, then re-fetch needed nodes
3. `get_screenshot(fileKey, nodeId)` — visual reference
4. Check `src/components/ui/` — reuse existing component before building new
5. Translate to project conventions:
   - Tailwind classes → CSS Module classes referencing `tokens.css`
   - Hardcoded hex/px → token variables
   - Inline `style={{}}` → CSS module class
6. Validate rendered output against screenshot before marking done

---

## UI & Styling rules

### Components
- All UI components: `src/components/ui/` — check here first
- Feature components: `src/components/`
- Each component: own folder — `src/components/ui/Button/index.tsx` + `Button.module.css`
- Named exports only: `export function Button(...)`

### Design tokens (`src/styles/tokens.css`)
- Colors: `--color-brand-primary`, `--color-neutral-*`, `--color-semantic-*`
- Typography: `--font-size-sm`, `--font-size-md`, `--font-weight-regular`, `--line-height-*`
- Spacing: `--space-1` (4px), `--space-2` (8px), `--space-3` (12px), `--space-4` (16px), `--space-6` (24px), `--space-8` (32px)
- Radius: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full`
- Shadows: `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- Light/dark mode via `prefers-color-scheme` — never hardcode dark/light values
- If `src/styles/tokens.css` does not exist, create it before any component work

### Assets
- Figma MCP `localhost` image/SVG → use directly, no substitution
- No new icon packages — use Figma MCP payload or existing `src/assets/icons/`
- Images → `src/assets/images/`, icons → `src/assets/icons/`

### Electron UI rules
- No `window.alert` / `window.confirm` / `window.prompt` — use Dialog components
- Traffic-light buttons: `padding-top: 28px` on any full-window top bar
- Persist preferences via `electron-store` — not `localStorage`

---

## Development commands

```bash
npm run dev        # Start Electron app in development mode (hot-reload)
npm run build      # Production build → out/
npm run preview    # Preview the production build
npm run lint       # Run ESLint across all .ts/.tsx files
npm run lint:fix   # Auto-fix lint issues
npm run format     # Run Prettier on src/ and electron/
```

TypeScript is checked by the build tools — there is no separate `tsc` watch script. To run a one-off type check:

```bash
npx tsc --noEmit
```
