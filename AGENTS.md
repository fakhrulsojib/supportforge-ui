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
5. **Use conventional commit messages** within each branch: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:`

---

## Phase Awareness

- Before starting work, **read ROADMAP.md** to identify the current phase and its status markers
- Only work on tasks within the **current phase** unless explicitly told otherwise
- Mark completed tasks with `[x]` in ROADMAP.md as you finish them

---

## Documentation Sync (Mandatory)

**Every implementation change MUST be reflected in the relevant markdown files** when applicable. This includes but is not limited to:

- **ROADMAP.md** — Update task checkboxes, add new tasks if scope expanded, mark phases complete
- **README.md** — Update setup instructions, API routes, project structure, tech stack if anything changes
- **.env.example** — Add new environment variables as they are introduced
- **AGENTS.md** — Update rules or checklists if architecture or workflow patterns change

> If you add a new page, component, API endpoint, or configuration — ask yourself: "Does any markdown file need to reflect this?" If yes, update it in the same commit.

---

## Mandatory Steps Per Task

1. **Read context** — review related existing files before writing new code
2. **Component pattern** — presentational components in `components/`, page-level composition in `pages/`
3. **Test the build** — `npm run build` must succeed with zero warnings before committing
4. **Lint** — `npm run lint` must pass with zero warnings
5. **Browser test** — if browser access is available, visually verify at 375px, 768px, and 1440px widths
6. **Commit message** — use conventional commits: `feat:`, `fix:`, `style:`, `refactor:`, `docs:`, `chore:`

---

## Architecture Rules

### Component Organization

```
src/
├── api/           # Centralized API client layer (Axios)
├── hooks/         # Custom React hooks
├── context/       # React Context providers (Auth, Tenant)
├── pages/         # Page-level components (route targets)
├── components/    # Presentational components
│   ├── chat/
│   ├── admin/
│   ├── analytics/
│   ├── layout/
│   └── shared/
├── styles/        # CSS design system + per-feature styles
└── utils/         # Constants, formatters, helpers
```

### Hard Rules

- **State management**: React Context + hooks only — no Redux
- **Styling**: Vanilla CSS with CSS custom properties — no Tailwind, no CSS-in-JS
- **API layer**: All HTTP calls go through `api/client.js` — never use `fetch()` or raw `axios` directly in components
- **Theming**: All colors, spacing, and typography must reference CSS custom properties from `styles/index.css`
- **Dark mode**: Must work via both `prefers-color-scheme` and manual toggle in `styles/theme.css`
- **No inline styles** — all styling must be in CSS files
- **Responsive**: Every component must render correctly at 375px, 768px, 1440px

---

## Testing Checklist (Every PR)

- [ ] Build succeeds: `npm run build` with zero warnings
- [ ] Lint passes: `npm run lint` with zero warnings
- [ ] All pages render without errors in the console
- [ ] Dark mode toggle works on every page
- [ ] Responsive layout verified at 375px, 768px, 1440px
- [ ] No hardcoded colors — all use CSS custom properties
- [ ] Accessible: proper ARIA labels, keyboard navigation

---

## When Browser Is Available

- Navigate to `http://localhost:5173` and verify the app renders
- Test the chat flow end-to-end: send message → verify streaming → check citations
- Verify dark mode toggle works on all pages
- Check responsive layout at 375px, 768px, 1440px widths
- Screenshot any visual bugs
- Verify no console errors

---

## Environment Setup

```bash
# Required env vars (see .env.example):
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/api/v1/ws/chat
VITE_APP_NAME=SupportForge
```
