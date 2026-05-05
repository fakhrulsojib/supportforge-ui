import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles/scaffold.css'

/**
 * SupportForge — Root Application Component
 *
 * Phase 3.1: Scaffold with placeholder route.
 * Subsequent sub-phases will add:
 *   3.2: AuthContext provider, ProtectedRoute, LoginPage
 *   3.3: ChatPage with WebSocket streaming
 *   3.4: AdminPage with document upload
 *   3.5: AnalyticsPage with dashboard
 *   3.6: Layout shell (Sidebar, Header), dark mode toggle
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ScaffoldPage />} />
      </Routes>
    </BrowserRouter>
  )
}

/**
 * Temporary scaffold page — confirms the design system is loaded
 * and the app is running. Will be replaced by ChatPage in Phase 3.3.
 */
function ScaffoldPage() {
  return (
    <div className="scaffold-page">
      <div className="scaffold-container sf-animate-fade-in-up">
        {/* Logo area */}
        <div className="scaffold-logo">
          <div className="scaffold-logo-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect width="48" height="48" rx="12" fill="url(#logo-gradient)" />
              <path d="M14 20C14 17.7909 15.7909 16 18 16H30C32.2091 16 34 17.7909 34 20V28C34 30.2091 32.2091 32 30 32H26L22 36V32H18C15.7909 32 14 30.2091 14 28V20Z" fill="white" fillOpacity="0.9" />
              <circle cx="21" cy="24" r="1.5" fill="hsl(249, 64%, 55%)" />
              <circle cx="27" cy="24" r="1.5" fill="hsl(249, 64%, 55%)" />
              <defs>
                <linearGradient id="logo-gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                  <stop stopColor="hsl(249, 64%, 55%)" />
                  <stop offset="1" stopColor="hsl(254, 55%, 40%)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="scaffold-title">SupportForge</h1>
          <p className="scaffold-subtitle">AI-Powered Customer Support Agent</p>
        </div>

        {/* Status card */}
        <div className="sf-card scaffold-status-card">
          <div className="scaffold-status-header">
            <span className="scaffold-status-dot"></span>
            <span className="scaffold-status-text">System Online</span>
          </div>

          <div className="scaffold-checklist">
            <div className="scaffold-check-item scaffold-check-done">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 8L7 11L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>React + Vite Scaffold</span>
            </div>
            <div className="scaffold-check-item scaffold-check-done">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 8L7 11L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Design System Loaded</span>
            </div>
            <div className="scaffold-check-item scaffold-check-done">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 8L7 11L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Dark / Light Theme Ready</span>
            </div>
            <div className="scaffold-check-item scaffold-check-pending">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span>Auth Flow (Phase 3.2)</span>
            </div>
            <div className="scaffold-check-item scaffold-check-pending">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span>Chat UI (Phase 3.3)</span>
            </div>
            <div className="scaffold-check-item scaffold-check-pending">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span>Admin Panel (Phase 3.4)</span>
            </div>
          </div>
        </div>

        {/* Design system preview */}
        <div className="scaffold-preview">
          <h3 className="scaffold-preview-title">Design System Preview</h3>
          <div className="scaffold-btn-row">
            <button className="sf-btn sf-btn-primary">Primary</button>
            <button className="sf-btn sf-btn-secondary">Secondary</button>
            <button className="sf-btn sf-btn-ghost">Ghost</button>
            <button className="sf-btn sf-btn-danger sf-btn-sm">Danger</button>
          </div>
          <div className="scaffold-badge-row">
            <span className="sf-badge sf-badge-success">Ready</span>
            <span className="sf-badge sf-badge-warning">Processing</span>
            <span className="sf-badge sf-badge-error">Failed</span>
            <span className="sf-badge sf-badge-info">Pending</span>
            <span className="sf-badge sf-badge-neutral">Draft</span>
          </div>
          <input
            className="sf-input"
            type="text"
            placeholder="Sample input — design tokens active"
            readOnly
            id="scaffold-sample-input"
          />
        </div>

        <p className="scaffold-footer">
          Backend API at <code>localhost:8000</code> • Frontend at <code>localhost:5173</code>
        </p>
      </div>
    </div>
  )
}

export default App
