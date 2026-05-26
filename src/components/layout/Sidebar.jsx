/**
 * Sidebar — main navigation panel with route-aware active states.
 *
 * Features:
 * - Navigation links: Chat, Admin (expandable), Analytics, Review Queue
 * - Active state indicator (left accent bar + highlight)
 * - Collapsible (desktop) / slide-out (mobile)
 * - Role-based visibility: Admin/Analytics visible to admin/agent only
 * - Admin group expands to: Knowledge Base + Settings
 *
 * Security:
 * - No tokens or sensitive data rendered or logged
 * - Tenant context is display-only (from auth state, not URL)
 */

import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { APP_NAME } from '../../utils/constants'
import { useCallback, useEffect, useState } from 'react'
import { getReviewStats } from '../../api/reviewApi'
import { listTenants } from '../../api/platformApi'
import '../../styles/review.css'
import '../../styles/settings.css'

/**
 * Navigation items with role restrictions.
 * Items with `group: true` render as expandable sections.
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
    group: true,
    children: [
      { path: '/admin', label: 'Knowledge Base', roles: ['admin', 'agent'] },
      { path: '/settings', label: 'Settings', roles: ['admin', 'superadmin'] },
    ],
  },
  {
    path: '/analytics',
    label: 'Analytics',
    roles: ['admin', 'agent'],
    icon: 'analytics',
  },
  {
    path: '/review',
    label: 'Review Queue',
    roles: ['admin', 'superadmin'],
    icon: 'review',
    hasBadge: true,
  },
]

/**
 * Platform navigation items (superadmin-only).
 * @type {Array<{path: string, label: string, icon: string, roles: string[]}>}
 */
const PLATFORM_ITEMS = [
  {
    path: '/platform/tenants',
    label: 'Tenants',
    roles: ['superadmin'],
    icon: 'tenants',
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
    case 'review':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 7l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'tenants':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 8h14" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 8v8" stroke="currentColor" strokeWidth="1.5" />
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

  // Admin group expand state — auto-expand when on admin sub-routes
  const [adminGroupOpen, setAdminGroupOpen] = useState(
    () => location.pathname.startsWith('/admin') || location.pathname.startsWith('/settings'),
  )

  // Fetch unreviewed count for badge
  const [badgeCount, setBadgeCount] = useState(0)
  const [tenantCount, setTenantCount] = useState(0)
  const fetchBadge = useCallback(async () => {
    if (userRole === 'admin' || userRole === 'superadmin') {
      try {
        const data = await getReviewStats()
        setBadgeCount(
          (data.unreviewed_negative || 0) +
          (data.unreviewed_flagged || 0) +
          (data.open_escalations || 0) +
          (data.unresolved_failed_queries || 0),
        )
      } catch {
        // badge is non-critical
      }
    }
    if (userRole === 'superadmin') {
      try {
        const platformData = await listTenants({ limit: 1, offset: 0 })
        setTenantCount(platformData.total || 0)
      } catch {
        // badge is non-critical
      }
    }
  }, [userRole])

  useEffect(() => {
    fetchBadge()

    // Listen for review actions from any page (mark reviewed, resolve, etc.)
    const handler = () => fetchBadge()
    window.addEventListener('sf:review-badge-update', handler)

    // Poll every 60s to catch new items from other sessions/users
    const interval = setInterval(fetchBadge, 60_000)

    return () => {
      window.removeEventListener('sf:review-badge-update', handler)
      clearInterval(interval)
    }
  }, [fetchBadge])

  /** Filter nav items by user role. */
  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole),
  )

  /** Filter platform items by user role. */
  const visiblePlatformItems = PLATFORM_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole),
  )

  /** Check if a path is the current active route. */
  function isActive(path) {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/chat'
    }
    if (path === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  /** Check if any child of a group is active. */
  function isGroupActive(item) {
    if (!item.children) return false
    return item.children.some((child) => isActive(child.path))
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
          {visibleItems.map((item) => {
            // Expandable group (Admin)
            if (item.group) {
              const groupActive = isGroupActive(item)
              const visibleChildren = (item.children || []).filter(
                (child) => !child.roles || child.roles.includes(userRole),
              )
              if (visibleChildren.length === 0) return null

              return (
                <div key={item.path} className="sidebar-group">
                  <button
                    type="button"
                    className={`sidebar-link ${groupActive ? 'sidebar-link-active' : ''}`}
                    onClick={() => setAdminGroupOpen((prev) => !prev)}
                    title={isCollapsed ? item.label : undefined}
                    id={`sidebar-nav-${item.icon}`}
                    aria-expanded={adminGroupOpen}
                  >
                    <span className="sidebar-link-icon">
                      <NavIcon name={item.icon} />
                    </span>
                    <span className="sidebar-link-text">{item.label}</span>
                    <span
                      className={`sidebar-group-chevron ${adminGroupOpen ? 'sidebar-group-chevron-open' : ''}`}
                      aria-hidden="true"
                    >
                      ›
                    </span>
                  </button>
                  <div
                    className={`sidebar-group-items ${adminGroupOpen ? 'sidebar-group-items-open' : ''}`}
                  >
                    {visibleChildren.map((child) => (
                      <button
                        key={child.path}
                        type="button"
                        className={`sidebar-sub-link ${isActive(child.path) ? 'sidebar-sub-link-active' : ''}`}
                        onClick={() => handleNavigate(child.path)}
                        aria-current={isActive(child.path) ? 'page' : undefined}
                        id={`sidebar-sub-${child.path.replace(/\//g, '-')}`}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            }

            // Regular nav link
            return (
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
                {item.hasBadge && badgeCount > 0 && (
                  <span className="review-tab-badge review-tab-badge-alert">{badgeCount}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Platform Section (superadmin only) */}
        {visiblePlatformItems.length > 0 && (
          <div className="sidebar-nav-section">
            <div className="sidebar-nav-label">Platform</div>
            {visiblePlatformItems.map((item) => (
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
                {tenantCount > 0 && (
                  <span className="review-tab-badge">{tenantCount}</span>
                )}
              </button>
            ))}
          </div>
        )}
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
