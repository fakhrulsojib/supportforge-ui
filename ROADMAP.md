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

### 3.1 — React + Vite Scaffold
- [ ] Initialize with `npx -y create-vite@latest ./ -- --template react`
- [ ] Install dependencies: `axios`, `react-router-dom`
- [ ] Create directory structure: `api/`, `hooks/`, `context/`, `pages/`, `components/`, `styles/`, `utils/`
- [ ] Design system: `index.css` with CSS custom properties (colors, spacing, typography, shadows)
- [ ] Theme: `theme.css` with dark/light mode variables
- [ ] Import Google Font (Inter) in `index.html`
- [ ] `vite.config.js` with API proxy → `http://localhost:8000`
- [ ] Verify: `npm run dev` starts, app renders at `localhost:5173`

### 3.2 — Auth Flow
- [ ] `AuthContext.jsx` — JWT storage, login/logout/refresh, `isAuthenticated` state
- [ ] `client.js` — Axios instance with Authorization header interceptor, auto-refresh on 401
- [ ] `authApi.js` — login, register, refresh
- [ ] `LoginPage.jsx` — email/password form, error display, redirect
- [ ] `ProtectedRoute.jsx` — redirect to login if not authenticated
- [ ] Browser test: login flow, token refresh, logout

### 3.3 — Chat UI
- [ ] `useWebSocket.js` — connect, send, receive streaming tokens, reconnect
- [ ] `ChatWindow.jsx` — message list + input, auto-scroll
- [ ] `MessageBubble.jsx` — user vs assistant, markdown rendering
- [ ] `StreamingIndicator.jsx` — typing dots animation
- [ ] `SourceCitation.jsx` — collapsible source cards
- [ ] `FeedbackButtons.jsx` — 👍/👎 per message
- [ ] `ChatPage.jsx` — compose all chat components
- [ ] Browser test: full chat flow at 375px, 768px, 1440px

### 3.4 — Admin Panel
- [ ] `ingestApi.js` — upload, list, delete documents
- [ ] `DocumentUploader.jsx` — drag-and-drop, file validation, progress bar
- [ ] `IngestionStatus.jsx` — document table with status badges
- [ ] `ModelSelector.jsx` — display current models (read-only)
- [ ] `AdminPage.jsx` — compose admin components, admin-only check
- [ ] Browser test: upload flow, status polling, delete

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
