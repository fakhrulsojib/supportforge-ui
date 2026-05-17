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
| Phase 8 | `phase-8/feedback-review-queue` | Review Queue page for negative feedback, escalations, flagged messages |
| Phase 12 | `phase-12/tenant-provisioning-ui` | Superadmin tenant management + Failed Queries tab in Review Queue |
| Phase 13 | `phase-13/analytics-backend` | Remove stale "not implemented" comments from analytics UI code |
| Phase 18 | `phase-18/user-management-ui` | User management + approval frontend |
| Phase 20 | `phase-20/moderation-dashboard-ui` | Moderation dashboard frontend |
| Phase 21 | `phase-21/ab-testing-config` | Settings page for tenant config (model, temperature, prompt variant) |
| Phase 23 | `phase-23/deployment-e2e` | Final polish, accessibility, performance audit, screenshots |

### Branch Rules

1. **Create the branch from `main`** before starting any phase work
2. **All commits within a phase go to its branch** — never commit phase work directly to `main`
3. **When a phase is complete**, open a PR from the phase branch → `main`
4. **Do NOT start the next phase** until the previous phase's PR is merged to `main`
5. **Use conventional commit messages** within each branch: `feat:`, `fix:`, `style:`, `refactor:`, `docs:`, `chore:`

### Scope Rules

> **One sub-phase per conversation.** Large phases (e.g., Phase 3 has multiple sub-phases: auth, chat, admin, analytics, layout) MUST be implemented one sub-phase at a time. Commit after each sub-phase. This prevents context loss and ensures each unit of work receives full validation. Do NOT implement multiple sub-phases in a single session.

### Cross-Repo Phases

Some phases (8, 13, 21, 23) span both `supportforge-api` and `supportforge-ui`. When working on a cross-repo phase:
1. The **backend portion** follows `supportforge-api/AGENTS.md`'s pipeline (Steps 1–9)
2. The **frontend portion** follows this file's pipeline (Steps 1–8)
3. Execute backend tasks first, then frontend tasks (frontend depends on API endpoints)
4. Commit in **each repo separately** with its own conventional commit message
5. Use the **same branch name** in both repos

---

## Task Execution Pipeline

> **This is the exact sequence an agent MUST follow for every task.** No step may be skipped. Each step has a gate condition that must be satisfied before proceeding to the next.
>
> **Failure protocol:** If a gate fails, fix the issue and re-run. **Maximum 3 attempts per gate.** After 3 failures on the same gate, STOP and report the error with full context (command output, file paths, error messages). Do NOT continue to the next step.

### Step 1 — Orient

1. Read `ROADMAP.md` and identify the current phase and the specific task to work on
2. Read all files in the directories that will be affected by the task
3. If this task depends on work from a previous task (e.g. an API endpoint, a context provider), verify that dependency exists and is functional
4. **Cross-cutting audit:** If this task introduces or modifies a cross-cutting concern (auth context, error boundaries, tenant context, theming), identify **ALL existing pages and components** that must also be updated. List them explicitly before writing any code.
5. **Impact analysis:** For any component being moved, renamed, or refactored — grep for all import references and list every file that will need updating.

> **Gate:** You can describe what you're about to build, which files you'll create or modify, which existing components need updating for cross-cutting concerns, and how the new code fits into the existing codebase.

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
   - **All API error responses** must be handled with user-facing feedback (toast, inline error, etc.)
   - **Auth tokens** — store in memory (React Context), NOT in `localStorage`
   - **Sensitive data** — never log tokens, passwords, or API keys to `console.*`

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

### Step 4 — Self-Review

> **This step exists because lint and build checks only catch syntax and import errors — they do NOT catch design flaws, security gaps, UX issues, or cross-cutting inconsistencies. Those are the issues that code reviewers find.**

1. Stage all changes first: `git add -A`, then run `git diff --cached` (full diff — **NOT** `--stat`) and read through every changed line as if you are an independent reviewer seeing this code for the first time.
2. For **every file**, systematically ask:
   - **Security:** Does this component check auth state before rendering protected content? Are tokens handled securely?
   - **Consistency:** Does this component follow the same patterns as other components in the same feature area? (Same prop naming, same CSS class naming, same error handling)
   - **Error handling:** What happens when the API returns 401? 403? 500? Network error? Does the user see helpful feedback?
   - **Cross-cutting:** Does this change affect any OTHER page or component? Did I update all consumers/importers?
   - **Cleanup:** Are there unused imports, dead CSS classes, or stale component files left from refactoring?
   - **Accessibility:** Does this component have proper ARIA labels, keyboard navigation, and focus management?
3. Check all components against the **Security Checklist** (below).
4. Check against the **Consistency Checklist** (below).
5. If you find ANY issue, go back to Step 2 and fix before continuing.

> **Gate:** You can explain why every component handles auth correctly, every error state has user feedback, every cross-cutting concern is addressed, and no deprecated code remains.

### Step 5 — Browser Test (if browser available)

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
8. **Auth flow:** If protected route — verify redirect to login when unauthenticated
9. **Error states:** Disconnect network / mock API errors → verify graceful degradation
10. Screenshot any visual bugs

> **Gate:** Feature works at all three viewports, in both light and dark mode, with zero console errors.

### Step 6 — Update Documentation

For each markdown file, check if this task requires an update:

| File | Update if... |
|---|---|
| `ROADMAP.md` | Task completed → mark `[x]`. New tasks discovered → add them. |
| `README.md` | New page/route, dependency, setup step, or project structure change. |
| `.env.example` | New `VITE_` environment variable introduced. |
| `AGENTS.md` | New component convention, workflow change, or architecture rule established. |

> **Gate:** All affected markdown files are updated. No stale information remains.

### Step 7 — Commit

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

### Step 8 — Update Master Plan

1. Open `../supportforge_plan.md` (the master implementation plan in the parent directory)
2. Find the checklist items that correspond to the task(s) you just completed
3. Mark them as done: `- [ ]` → `- [x]`
4. Do **not** modify any other content in the plan

> **Gate:** Every task you completed in this session is marked `[x]` in `supportforge_plan.md`.

---

## Security Checklist

> **Check EVERY item before committing ANY auth-related or data-handling code.** This checklist exists because security gaps were the #1 category of code review findings in the backend and the same patterns apply to the frontend.

### Authentication & Authorization
- [ ] All protected routes are wrapped in `<ProtectedRoute>` or equivalent auth guard
- [ ] Unauthenticated users are redirected to login — protected content is never briefly visible
- [ ] Auth tokens are stored in React Context (memory) — **NEVER** in `localStorage` or `sessionStorage`
- [ ] Token refresh is handled automatically by the API client interceptor
- [ ] Logout clears all auth state and redirects to login

### Sensitive Data
- [ ] No tokens, passwords, or API keys are logged to `console.*` in production
- [ ] No sensitive data appears in URL query parameters
- [ ] Error messages shown to users do not include stack traces, raw API errors, or internal IDs
- [ ] Form inputs for passwords use `type="password"` and are not autocompleted for shared machines

### Multi-Tenant Isolation
- [ ] Tenant context is set from the authenticated user's token — never from URL params or user input
- [ ] Admin UI only shows data for the authenticated tenant (no global admin view unless role allows)
- [ ] Switching tenants invalidates cached data from the previous tenant

### Input Handling
- [ ] All user inputs are trimmed and validated before sending to the API
- [ ] File uploads validate type and size on the client before sending
- [ ] Rich text / markdown rendering uses safe rendering (no `dangerouslySetInnerHTML` with user content)

---

## Consistency Checklist

> **Check EVERY item to ensure the codebase is internally consistent.** Inconsistency is a frequent source of review findings.

### Patterns
- [ ] All API calls go through `src/api/client.js` — no raw `fetch()` or `axios` anywhere
- [ ] All components in the same feature area follow the same prop naming conventions
- [ ] All error states use the same pattern (toast, inline error, error boundary — pick one per context)
- [ ] WebSocket frame handlers account for ALL frame types defined by the backend (`token`, `source`, `done`, `thinking`, `error`, `disclaimer`). If the backend adds a new frame type, the frontend must handle or explicitly ignore it.
- [ ] All loading states use the same pattern (`<LoadingSpinner>` or skeleton, consistently)

### CSS & Theming
- [ ] No hardcoded colors — all use `var(--sf-color-*)`
- [ ] No hardcoded spacing — all use `var(--sf-space-*)`
- [ ] CSS positioning is correct — every `position: absolute` child has a `position: relative` (or other positioned) ancestor
- [ ] New CSS animations and transitions render correctly — not invisible, not misplaced, not clipped by overflow
- [ ] Dark mode variables are defined for every custom property used
- [ ] CSS class names follow the same naming convention (BEM, feature-prefix, etc.)

### Imports & Structure
- [ ] No deprecated import paths left after refactoring — all consumers use the canonical path
- [ ] No orphan component files (created but never imported/rendered)
- [ ] No unused CSS files or dead CSS classes
- [ ] All components have a meaningful display name (for React DevTools debugging)

---

## Phase Completion Checklist

> **Before marking ANY phase as complete, verify EVERY item below.** This is the final gate before a phase branch can be submitted as a PR.

- [ ] Every protected route has an auth guard (checked against Security Checklist)
- [ ] Every data-displaying component handles loading, error, and empty states
- [ ] All deprecated component files from refactoring are removed — no orphans remain
- [ ] All new `VITE_` env vars are in `.env.example` with documentation
- [ ] All new dependencies are in `package.json`
- [ ] `git diff main --name-only` shows no unexpected files
- [ ] Full self-review of `git diff main` completed (not just `--stat`)
- [ ] All items in `ROADMAP.md` for this phase are marked `[x]`
- [ ] All items in `../supportforge_plan.md` for this phase are marked `[x]`
- [ ] `npm run lint` passes with zero warnings
- [ ] `npm run build` passes with zero warnings
- [ ] All three viewports tested (375px, 768px, 1440px)
- [ ] Dark mode tested — no broken colors or invisible text

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
│   ├── reviewApi.js
│   ├── platformApi.js
│   ├── failedQueryApi.js
│   ├── modelsApi.js
│   └── authApi.js
├── hooks/         # Custom React hooks
│   ├── useWebSocket.js
│   └── useAuth.js
├── context/       # React Context providers
│   └── AuthContext.jsx
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
| Feature-specific | `components/{feature}/` | `chat/MessageBubble.jsx`, `admin/DocumentUploader.jsx`, `admin/TemperatureSlider.jsx` |
| Page composition | `pages/` | `ChatPage.jsx`, `AdminPage.jsx`, `PlatformTenantsPage.jsx`, `ReviewPage.jsx` |
| Layout shell | `components/layout/` | `Sidebar.jsx`, `Header.jsx`, `AppLayout.jsx`, `ProtectedRoute.jsx` |

### CSS Rules

- All design tokens defined in `src/styles/index.css` as `--sf-*` custom properties
- Feature styles go in `src/styles/{feature}.css` (e.g. `chat.css`, `admin.css`, `review.css`, `platform.css`, `analytics.css`)
- Dark mode variables in `src/styles/theme.css`
- Layout shell in `src/styles/layout.css`
- Shared component styles in `src/styles/shared.css`
- Scaffold/skeleton styles in `src/styles/scaffold.css`
- Never hardcode colors — always `var(--sf-color-*)`
- Responsive breakpoints: 375px (mobile), 768px (tablet), 1440px (desktop)

### Layout Shell

The application uses a layout shell (`AppLayout`) that wraps all authenticated pages:
- `Sidebar` — app-level navigation (Chat, Admin, Analytics, Review Queue, Platform Tenants) with role-based filtering
- `Header` — page title, tenant badge, dark mode toggle, user avatar with logout dropdown
- `ErrorBoundary` — catches render errors with friendly fallback UI
- Dark mode is toggled via CSS class on `<html>` and persisted in `localStorage` (`sf-theme` key)
- Sidebar collapse state persisted in `localStorage` (`sf-sidebar-collapsed` key)

> **Note:** Only non-sensitive UI preferences are stored in `localStorage`. Auth tokens remain in React Context (memory) per Security Checklist.

---

## Browser Testing

### Test User Credentials

When a live backend is available, test users are created by the backend seed scripts. **Do not hardcode credentials here — retrieve them from the scripts at runtime.**

| Role | Email | Created by |
|---|---|---|
| Viewer (chat only) | `viewer@acme.dev` | `scripts/seed_demo.py` |
| Admin (full tenant access) | `admin@acme.dev` | `scripts/seed_demo.py` |
| Superadmin (platform management) | `admin@platform.dev` | `scripts/create_superadmin.py` |

> **Convention:** Passwords and Tenant IDs are defined in the backend seed scripts — check `supportforge-api/scripts/seed_demo.py` for the current values. Use the **admin** credentials when testing Admin/Analytics/Review Queue pages. Use the **superadmin** credentials when testing platform tenant management. The Tenant ID field requires the UUID, not the slug.

---

## Environment Setup

```bash
# Required env vars (see .env.example):
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/api/v1/ws/chat
VITE_APP_NAME=SupportForge
```

