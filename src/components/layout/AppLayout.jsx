/**
 * AppLayout — layout shell wrapping Sidebar, Header, and content area.
 *
 * Manages:
 * - Sidebar collapse state (desktop) with localStorage persistence
 * - Mobile sidebar open/close
 * - Dark mode toggle with localStorage persistence + system preference
 *
 * Security:
 * - Only non-sensitive preferences stored in localStorage (theme, sidebar state)
 * - No tokens, passwords, or API keys persisted
 */

import { useState, useEffect, useCallback } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import ErrorBoundary from '../shared/ErrorBoundary'
import { useAuth } from '../../hooks/useAuth'

/** LocalStorage key for sidebar collapsed state. */
const SIDEBAR_COLLAPSED_KEY = 'sf-sidebar-collapsed'

/** LocalStorage key for theme preference. */
const THEME_KEY = 'sf-theme'

/**
 * Read the initial dark mode state:
 * 1. Check localStorage for explicit user preference
 * 2. Fall back to system prefers-color-scheme
 */
function getInitialDarkMode() {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'dark') return true
  if (stored === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * Read the initial sidebar collapsed state from localStorage.
 */
function getInitialCollapsed() {
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
}

/**
 * @param {{ children: React.ReactNode }} props
 */
/** Navigation items — must stay in sync with Sidebar.jsx NAV_ITEMS. */
const NAV_ITEMS = [
  { roles: null },                  // Chat — visible to all
  { roles: ['admin', 'agent'] },    // Admin
  { roles: ['admin', 'agent'] },    // Analytics
  { roles: ['admin', 'superadmin'] },    // Review Queue
  { roles: ['superadmin'] },        // Platform Tenants
]

export default function AppLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsed)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode)
  const { user } = useAuth()

  const userRole = user?.role || ''
  const visibleItemCount = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole),
  ).length
  /** Hide sidebar when user only has one nav option (viewers). */
  const hasSidebar = visibleItemCount > 1

  /** Apply or remove .dark class on <html> element. */
  useEffect(() => {
    const htmlEl = document.documentElement
    if (isDarkMode) {
      htmlEl.classList.add('dark')
      htmlEl.classList.remove('light')
    } else {
      htmlEl.classList.remove('dark')
      htmlEl.classList.add('light')
    }
    localStorage.setItem(THEME_KEY, isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  /** Persist sidebar collapsed state. */
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed))
  }, [isCollapsed])

  /** Close mobile sidebar on route change (via resize). */
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 768) {
        setIsMobileOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev)
  }, [])

  const toggleMobileMenu = useCallback(() => {
    setIsMobileOpen((prev) => !prev)
  }, [])

  const closeMobileMenu = useCallback(() => {
    setIsMobileOpen(false)
  }, [])

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => !prev)
  }, [])

  const contentClasses = [
    'layout-content',
    !hasSidebar ? 'layout-content-no-sidebar' : isCollapsed ? 'layout-content-collapsed' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="layout-shell">
      {hasSidebar && (
        <>
          {/* Mobile overlay */}
          <div
            className={`sidebar-mobile-overlay ${isMobileOpen ? 'sidebar-mobile-overlay-visible' : ''}`}
            onClick={closeMobileMenu}
            role="presentation"
          />

          {/* Sidebar */}
          <Sidebar
            isCollapsed={isCollapsed}
            onToggleCollapse={toggleCollapse}
            isMobileOpen={isMobileOpen}
            onMobileClose={closeMobileMenu}
          />
        </>
      )}

      {/* Content area */}
      <div className={contentClasses}>
        <Header
          onMobileMenuToggle={hasSidebar ? toggleMobileMenu : undefined}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          hasSidebar={hasSidebar}
        />
        <main className="layout-main">
          <ErrorBoundary>
            <div className="page-transition">
              {children}
            </div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
