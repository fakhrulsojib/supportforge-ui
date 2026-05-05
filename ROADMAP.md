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
- [ ] Browser test: login flow, token refresh, logout _(deferred to Phase 3.6)_

### 3.3 — Chat UI ✅
- [x] `useWebSocket.js` — connect, send, receive streaming tokens, reconnect
- [x] `ChatWindow.jsx` — message list + input, auto-scroll
- [x] `MessageBubble.jsx` — user vs assistant, markdown rendering
- [x] `StreamingIndicator.jsx` — typing dots animation
- [x] `SourceCitation.jsx` — collapsible source cards
- [x] `FeedbackButtons.jsx` — 👍/👎 per message
- [x] `ChatPage.jsx` — compose all chat components
- [ ] Browser test: full chat flow at 375px, 768px, 1440px _(deferred — requires live backend)_

### 3.4 — Admin Panel ✅
- [x] `ingestApi.js` — upload, list, delete documents
- [x] `DocumentUploader.jsx` — drag-and-drop, file validation, progress bar
- [x] `IngestionStatus.jsx` — document table with status badges
- [x] `ModelSelector.jsx` — display current models (read-only)
- [x] `AdminPage.jsx` — compose admin components, admin-only check
- [ ] Browser test: upload flow, status polling, delete _(deferred — requires live backend)_

### 3.5 — Analytics Dashboard
- [ ] `analyticsApi.js` — daily stats, top intents, satisfaction
- [ ] `ConversationChart.jsx` — line chart (CSS/SVG, no heavy lib)
- [ ] `TopicCloud.jsx` — sized intent tags
- [ ] `SatisfactionGauge.jsx` — percentage ring
- [ ] `AnalyticsPage.jsx` — compose dashboard, date range picker
- [ ] Browser test: charts render, hover states, empty state

### 3.6 — Layout & Polish
- [ ] `Sidebar.jsx` — nav links, active state, collapsible on mobile
- [ ] `Header.jsx` — tenant name, avatar, dark mode toggle, logout
- [ ] `ErrorBoundary.jsx` — catch render errors, friendly fallback
- [ ] `LoadingSpinner.jsx` — reusable with size variants
- [ ] Dark mode: CSS class on `<html>`, localStorage persistence
- [ ] Micro-animations: message fade-in, sidebar slide, button hover, page transitions
- [ ] Browser test: dark mode toggle, responsive breakpoints, navigation

---

## Phase 4 — Production Polish 🔲

> **Branch:** `phase-4/production-polish`

### 4.3 — Embeddable Chat Widget
- [ ] `widget/` directory — standalone JS bundle
- [ ] `<script>` tag with `data-tenant` attribute
- [ ] Floating chat bubble → expandable chat window
- [ ] Shadow DOM for CSS isolation
- [ ] Tenant-scoped WebSocket

### 4.6 — UI Polish
- [ ] Screenshots for README
- [ ] Final responsive audit
- [ ] Accessibility pass (ARIA, keyboard nav, focus management)
- [ ] Performance audit (bundle size, lazy loading)
