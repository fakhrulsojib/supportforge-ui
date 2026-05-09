/**
 * Sidebar — main navigation panel with route-aware active states.
 *
 * Features:
 * - Navigation links: Chat, Admin, Analytics
 * - Active state indicator (left accent bar + highlight)
 * - Collapsible (desktop) / slide-out (mobile)
 * - Role-based visibility: Admin/Analytics visible to admin/agent only
 *
 * Security:
 * - No tokens or sensitive data rendered or logged
 * - Tenant context is display-only (from auth state, not URL)
 */

import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { APP_NAME } from '../../utils/constants'

/**
 * Navigation items with role restrictions.
 * @type {Array<{path: string, label: string, icon: string, roles: string[]|null}>}
 */
const NAV_ITEMS = [
  {
    path: '/',
    label: 'Chat',
    roles: null, // visible to all
    icon: 'chat',
  },
  {
    path: '/admin',
    label: 'Admin',
    roles: ['admin', 'agent'],
    icon: 'admin',
  },
  {
    path: '/analytics',
    label: 'Analytics',
    roles: ['admin', 'agent'],
    icon: 'analytics',
  },
]

/**
 * SVG icon lookup by name.
 */
function NavIcon({ name }) {
  switch (name) {
    case 'chat':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M4 6c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v5c0 1.1-.9 2-2 2h-3l-3.5 3.5V13H6c-1.1 0-2-.9-2-2V6z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'admin':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="3" y="3" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 7h6M7 10h4M7 13h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'analytics':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="2" y="2" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M5 14l4-5 3 3 4-6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    default:
      return null
  }
}

/**
 * @param {{ isCollapsed: boolean, onToggleCollapse: () => void, isMobileOpen: boolean, onMobileClose: () => void }} props
 */
export default function Sidebar({ isCollapsed, onToggleCollapse, isMobileOpen, onMobileClose }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const userRole = user?.role || ''

  /** Filter nav items by user role. */
  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole),
  )

  /** Check if a path is the current active route. */
  function isActive(path) {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  /** Navigate and close mobile sidebar. */
  function handleNavigate(path) {
    navigate(path)
    onMobileClose()
  }

  const sidebarClasses = [
    'sidebar',
    isCollapsed ? 'sidebar-collapsed' : '',
    isMobileOpen ? 'sidebar-mobile-open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <aside className={sidebarClasses} aria-label="Main navigation" id="main-sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M7 10C7 8.34 8.34 7 10 7H14C15.66 7 17 8.34 17 10V14C17 15.66 15.66 17 14 17H12L9 20V17H10C8.34 17 7 15.66 7 14V10Z"
              fill="currentColor"
              fillOpacity="0.9"
            />
          </svg>
        </div>
        <span className="sidebar-brand-text">{APP_NAME}</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-section">
          <div className="sidebar-nav-label">Navigation</div>
          {visibleItems.map((item) => (
            <button
              key={item.path}
              type="button"
              className={`sidebar-link ${isActive(item.path) ? 'sidebar-link-active' : ''}`}
              onClick={() => handleNavigate(item.path)}
              aria-current={isActive(item.path) ? 'page' : undefined}
              title={isCollapsed ? item.label : undefined}
              id={`sidebar-nav-${item.icon}`}
            >
              <span className="sidebar-link-icon">
                <NavIcon name={item.icon} />
              </span>
              <span className="sidebar-link-text">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Footer with collapse toggle */}
      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          id="sidebar-collapse-toggle"
        >
          <svg
            className="sidebar-collapse-icon"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M10 3L5 8l5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="sidebar-collapse-text">Collapse</span>
        </button>
      </div>
    </aside>
  )
}
