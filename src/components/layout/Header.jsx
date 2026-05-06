/**
 * Header — top bar with tenant info, dark mode toggle, and user menu.
 *
 * Features:
 * - Mobile sidebar toggle button
 * - Current page title (derived from route)
 * - Tenant badge showing tenant ID
 * - Dark mode toggle (sun/moon icon)
 * - User avatar with dropdown (role info + logout)
 *
 * Security:
 * - Logout clears all auth state via AuthContext
 * - No tokens or sensitive data rendered or logged
 * - Tenant info comes from auth state, not user input
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

/**
 * Map route paths to page titles.
 */
const PAGE_TITLES = {
  '/': 'Chat',
  '/admin': 'Admin Panel',
  '/analytics': 'Analytics',
}

/**
 * @param {{
 *   onMobileMenuToggle: () => void,
 *   isDarkMode: boolean,
 *   onToggleDarkMode: () => void,
 * }} props
 */
export default function Header({ onMobileMenuToggle, isDarkMode, onToggleDarkMode, hasSidebar = true }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const pageTitle = PAGE_TITLES[location.pathname] || 'SupportForge'

  /** Generate initials from user ID for avatar. */
  const avatarInitial = user?.role
    ? user.role.charAt(0).toUpperCase()
    : '?'

  /** Close dropdown on click outside. */
  const handleClickOutside = useCallback((event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDropdownOpen(false)
    }
  }, [])

  useEffect(() => {
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen, handleClickOutside])

  /** Close dropdown on Escape key. */
  useEffect(() => {
    function handleEscape(e) {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false)
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isDropdownOpen])

  function handleLogout() {
    setIsDropdownOpen(false)
    logout()
  }

  return (
    <header className="header" role="banner">
      <div className="header-left">
        {/* Mobile sidebar toggle — hidden when sidebar is absent */}
        {hasSidebar && (
          <button
            type="button"
            className="header-mobile-toggle"
            onClick={onMobileMenuToggle}
            aria-label="Toggle navigation menu"
            id="header-mobile-toggle"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M3 5h14M3 10h14M3 15h14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}

        <h1 className="header-page-title">{pageTitle}</h1>
      </div>

      <div className="header-right">
        {/* Tenant badge */}
        {(user?.tenantName || user?.tenantId) && (
          <div className="header-tenant" aria-label={`Tenant: ${user.tenantName || user.tenantId}`}>
            <span className="header-tenant-dot" aria-hidden="true" />
            <span>{user.tenantName || user.tenantId}</span>
          </div>
        )}

        {/* Dark mode toggle */}
        <button
          type="button"
          className="header-theme-btn"
          onClick={onToggleDarkMode}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          id="header-theme-toggle"
        >
          {isDarkMode ? (
            <svg className="header-theme-icon" width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M10 2v2m0 12v2m8-8h-2M4 10H2m13.07-5.07l-1.41 1.41M6.34 13.66l-1.41 1.41m0-10.14l1.41 1.41m7.32 7.32l1.41 1.41"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg className="header-theme-icon" width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M17 11.5a7 7 0 01-9.5-9.5A7 7 0 1017 11.5z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        {/* User avatar & dropdown */}
        <div className="header-user-menu" ref={dropdownRef}>
          <button
            type="button"
            className="header-avatar"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
            aria-label="User menu"
            id="header-user-avatar"
          >
            {avatarInitial}
          </button>

          {isDropdownOpen && (
            <div className="header-dropdown" role="menu" aria-label="User menu">
              {/* User info */}
              <div className="header-dropdown-info">
                <strong>{user?.role || 'User'}</strong>
                {(user?.tenantName || user?.tenantId) && <span>Tenant: {user.tenantName || user.tenantId}</span>}
              </div>

              <div className="header-dropdown-divider" />

              {/* Logout */}
              <button
                type="button"
                className="header-dropdown-item header-dropdown-item-danger"
                onClick={handleLogout}
                role="menuitem"
                id="header-logout-btn"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M6 14H4a2 2 0 01-2-2V4a2 2 0 012-2h2m4 10l4-4-4-4m4 4H6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
