# SupportForge UI — Roadmap

> Implementation phases for the frontend. Each phase is implemented in a dedicated git branch and merged to `main` via PR.

## Phase 0 — Repository Bootstrap ✅

- [x] Initialize git repo, `.gitignore` (Node), `LICENSE` (MIT)
- [x] Create `README.md` with project overview and setup instructions
- [x] Create `ROADMAP.md` (this file)
- [x] Create `AGENTS.md` with AI agent instructions
- [x] Create `.env.example`

---

## Phase 3 — Frontend Implementation 🔲

> **Branch:** `phase-3/frontend-implementation`

### 3.1 — React + Vite Scaffold ✅
- [x] Initialize with `npx -y create-vite@latest ./ -- --template react`
- [x] Install dependencies: `axios`, `react-router-dom`
- [x] Create directory structure: `api/`, `hooks/`, `context/`, `pages/`, `components/`, `styles/`, `utils/`
- [x] Design system: `index.css` with CSS custom properties (colors, spacing, typography, shadows)
- [x] Theme: `theme.css` with dark/light mode variables
- [x] Import Google Font (Inter) in `index.html`
- [x] `vite.config.js` with API proxy → `http://localhost:8000`
- [x] Verify: `npm run lint` + `npm run build` pass with zero errors


### 3.2 — Auth Flow ✅
- [x] `AuthContext.jsx` — JWT in-memory storage, login/logout/refresh, `isAuthenticated` state
- [x] `client.js` — Axios instance with Authorization header interceptor, auto-refresh on 401
- [x] `authApi.js` — login, register, refreshAccessToken
- [x] `useAuth.js` — convenience hook (separated for react-refresh compliance)
- [x] `LoginPage.jsx` — email/password/tenant form, registration mode, error display, redirect
- [x] `ProtectedRoute.jsx` — redirect to login if not authenticated
- [x] `auth.css` — login page styling using design system tokens
- [x] Verify: `npm run lint` (0 warnings) + `npm run build` (0 errors)
- [x] Browser test: login flow, token refresh, logout ✅

### 3.3 — Chat UI ✅
- [x] `useWebSocket.js` — connect, send, receive streaming tokens, reconnect
- [x] `ChatWindow.jsx` — message list + input, auto-scroll
- [x] `MessageBubble.jsx` — user vs assistant, markdown rendering
- [x] `StreamingIndicator.jsx` — typing dots animation
- [x] `SourceCitation.jsx` — collapsible source cards
- [x] `FeedbackButtons.jsx` — 👍/👎 per message
- [x] `ChatPage.jsx` — compose all chat components
- [x] Browser test: full chat flow at 375px, 768px, 1440px ✅

### 3.4 — Admin Panel ✅
- [x] `ingestApi.js` — upload, list, delete documents
- [x] `DocumentUploader.jsx` — drag-and-drop, file validation, progress bar
- [x] `IngestionStatus.jsx` — document table with status badges
- [x] `ModelSelector.jsx` — display current models (read-only)
- [x] `AdminPage.jsx` — compose admin components, admin-only check
- [x] Browser test: upload flow, status polling, delete ✅

### 3.5 — Analytics Dashboard ✅
- [x] `analyticsApi.js` — daily stats, top intents, satisfaction
- [x] `ConversationChart.jsx` — line chart (CSS/SVG, no heavy lib)
- [x] `TopicCloud.jsx` — sized intent tags
- [x] `SatisfactionGauge.jsx` — percentage ring
- [x] `AnalyticsPage.jsx` — compose dashboard, date range picker
- [x] Browser test: charts render, hover states, empty state ✅

### 3.6 — Layout & Polish ✅
- [x] `Sidebar.jsx` — nav links, active state, collapsible on mobile
- [x] `Header.jsx` — tenant name, avatar, dark mode toggle, logout
- [x] `ErrorBoundary.jsx` — catch render errors, friendly fallback
- [x] `LoadingSpinner.jsx` — reusable with size variants
- [x] Dark mode: CSS class on `<html>`, localStorage persistence
- [x] Micro-animations: message fade-in, sidebar slide, button hover, page transitions
- [x] Browser test: dark mode toggle, responsive breakpoints, navigation ✅

---

## Upcoming Phases (8–22) 🔲

> See `supportforge_plan.md` for detailed task lists and gotchas.

| Phase | Name | Priority | Status |
|---|---|---|---|
| 8 | Feedback Review Queue | High | 🔲 |
| 12 | Tenant Provisioning UI | High | 🔲 |
| 17 | User Management UI | Medium | 🔲 |
| 19 | Moderation Dashboard UI | Medium | 🔲 |
| 20 | A/B Testing & Tenant Config | Low | 🔲 |
| 22 | Deployment, Docs & E2E | Low | 🔲 |

