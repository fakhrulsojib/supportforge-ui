# Agent Instructions — SupportForge UI

## Project Overview

SupportForge is a production-grade, multi-tenant AI customer support agent. This is the **frontend** repository built with React + Vite, using vanilla CSS with custom properties for theming.

**Full implementation plan:** See [ROADMAP.md](ROADMAP.md) for the phased roadmap and task breakdown.

---

## Branch Strategy

**Every implementation phase MUST be developed in its own dedicated git branch.** The completed phase branch is then submitted as a Pull Request to `main`.

| Phase | Branch Name | Description |
|---|---|---|
| Phase 0 | `phase-0/repository-bootstrap` | Repo setup, docs, env config |
| Phase 3 | `phase-3/frontend-implementation` | Vite scaffold, auth, chat UI, admin panel, analytics, layout & polish |
| Phase 4 | `phase-4/production-polish` | Embeddable widget, final polish, accessibility, performance audit |

### Branch Rules

1. **Create the branch from `main`** before starting any phase work
2. **All commits within a phase go to its branch** — never commit phase work directly to `main`
3. **When a phase is complete**, open a PR from the phase branch → `main`
4. **Do NOT start the next phase** until the previous phase's PR is merged to `main`
5. **Use conventional commit messages** within each branch: `feat:`, `fix:`, `style:`, `refactor:`, `docs:`, `chore:`

---

## Task Execution Pipeline

> **This is the exact sequence an agent MUST follow for every task.** No step may be skipped. Each step has a gate condition that must be satisfied before proceeding to the next.

### Step 1 — Orient

1. Read `ROADMAP.md` and identify the current phase and the specific task to work on
2. Read all files in the directories that will be affected by the task
3. If this task depends on work from a previous task (e.g. an API endpoint, a context provider), verify that dependency exists and is functional

> **Gate:** You can describe what you're about to build, which files you'll create or modify, and which existing components you'll compose with.

### Step 2 — Implement

1. Create or modify the component/page/hook/style files
2. Follow these constraints:
   - **Presentational components** go in `src/components/{feature}/`
   - **Page-level composition** goes in `src/pages/`
   - **All HTTP calls** go through `src/api/client.js` — never use raw `fetch()` or `axios` directly
   - **All colors, spacing, typography** must reference CSS custom properties from `src/styles/index.css`
   - **No inline styles** — all styling in CSS files
   - **No Tailwind, no CSS-in-JS** — vanilla CSS with custom properties only
   - **State management** — React Context + hooks only, no Redux
   - **Dark mode** — must work via `prefers-color-scheme` and manual toggle

> **Gate:** The new component/page renders without errors in the browser console.

### Step 3 — Validate

Run each of these commands in order. **If any command fails, fix the issue before proceeding.**

```bash
# 3a. Lint (zero warnings)
npm run lint

# 3b. Build (zero warnings — catches type errors, unused imports, missing deps)
npm run build
```

> **Gate:** Both commands exit with code 0.

### Step 4 — Browser Test (if browser available)

1. Start the dev server: `npm run dev`
2. Navigate to `http://localhost:5173`
3. Verify the new component/page renders correctly
4. Test at three viewports:
   - **Mobile:** 375px width
   - **Tablet:** 768px width
   - **Desktop:** 1440px width
5. Toggle dark mode — verify no broken colors or invisible text
6. Open browser console — verify zero errors or warnings
7. If chat-related: send a message → verify streaming → check source citations appear
8. Screenshot any visual bugs

> **Gate:** Feature works at all three viewports, in both light and dark mode, with zero console errors.

### Step 5 — Update Documentation

For each markdown file, check if this task requires an update:

| File | Update if... |
|---|---|
| `ROADMAP.md` | Task completed → mark `[x]`. New tasks discovered → add them. |
| `README.md` | New page/route, dependency, setup step, or project structure change. |
| `.env.example` | New `VITE_` environment variable introduced. |
| `AGENTS.md` | New component convention, workflow change, or architecture rule established. |

> **Gate:** All affected markdown files are updated. No stale information remains.

### Step 6 — Commit

1. Stage all changes: `git add -A`
2. Review staged changes: `git diff --cached --stat`
3. Commit with a conventional commit message:
   - `feat: <description>` — new component, page, or feature
   - `fix: <description>` — bug fix
   - `style: <description>` — CSS changes, visual polish
   - `refactor: <description>` — code restructuring, no behavior change
   - `docs: <description>` — documentation-only changes
   - `chore: <description>` — tooling, config, dependencies

> **Gate:** `git status` shows a clean working tree.

---

## Architecture Reference

### Directory Structure

```
src/
├── api/           # Centralized API client layer (Axios)
│   ├── client.js  # Axios instance + JWT interceptor + auto-refresh
│   ├── chatApi.js
│   ├── ingestApi.js
│   ├── tenantApi.js
│   ├── analyticsApi.js
│   └── authApi.js
├── hooks/         # Custom React hooks
│   ├── useWebSocket.js
│   ├── useAuth.js
│   └── useTenant.js
├── context/       # React Context providers
│   ├── AuthContext.jsx
│   └── TenantContext.jsx
├── pages/         # Page-level components (route targets)
├── components/    # Presentational components
│   ├── chat/
│   ├── admin/
│   ├── analytics/
│   ├── layout/
│   └── shared/
├── styles/        # CSS design system
│   ├── index.css  # Design tokens (custom properties)
│   ├── theme.css  # Dark/light mode
│   └── *.css      # Per-feature styles
└── utils/         # Constants, formatters, helpers
```

### Component Conventions

| Type | Location | Example |
|---|---|---|
| Shared/reusable UI | `components/shared/` | `LoadingSpinner.jsx`, `ErrorBoundary.jsx` |
| Feature-specific | `components/{feature}/` | `chat/MessageBubble.jsx`, `admin/DocumentUploader.jsx` |
| Page composition | `pages/` | `ChatPage.jsx`, `AdminPage.jsx` |
| Layout shell | `components/layout/` | `Sidebar.jsx`, `Header.jsx`, `ProtectedRoute.jsx` |

### CSS Rules

- All design tokens defined in `src/styles/index.css` as `--sf-*` custom properties
- Feature styles go in `src/styles/{feature}.css`
- Dark mode variables in `src/styles/theme.css`
- Never hardcode colors — always `var(--sf-color-*)`
- Responsive breakpoints: 375px (mobile), 768px (tablet), 1440px (desktop)

---

## Environment Setup

```bash
# Required env vars (see .env.example):
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/api/v1/ws/chat
VITE_APP_NAME=SupportForge
```
