/**
 * Authentication context — provides auth state and methods to the entire app.
 *
 * Security rules (from AGENTS.md):
 * - Tokens stored in React state (memory) — NEVER localStorage/sessionStorage
 * - No tokens, passwords, or API keys logged to console
 * - Logout clears all auth state and redirects to login
 */

/* eslint-disable react-refresh/only-export-components */

import { createContext, useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as apiLogin, register as apiRegister, refreshAccessToken } from '../api/authApi'
import {
  setAccessToken,
  setRefreshToken,
  getRefreshToken,
  clearTokens,
} from '../api/client'

export const AuthContext = createContext(null)

/**
 * Decode the payload from a JWT access token.
 * Does NOT verify the signature — that's the backend's job.
 *
 * @param {string} token
 * @returns {{ user_id: string, tenant_id: string, role: string, exp: number } | null}
 */
function decodeTokenPayload(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1]))
    return {
      user_id: payload.user_id || payload.sub || '',
      tenant_id: payload.tenant_id || '',
      role: payload.role || '',
      exp: payload.exp || 0,
    }
  } catch {
    return null
  }
}

/**
 * AuthProvider — wraps the app and manages authentication lifecycle.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // Start loading if a refresh token exists (silent re-auth attempt)
  const [isLoading, setIsLoading] = useState(() => !!getRefreshToken())
  const navigate = useNavigate()
  const refreshTimerRef = useRef(null)

  const isAuthenticated = user !== null

  /**
   * Schedule a token refresh before the access token expires.
   * Refreshes 60 seconds before expiry, or immediately if < 60s remain.
   */
  const scheduleRefresh = useCallback((expiresIn) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
    }

    // Refresh 60 seconds before expiry, minimum 10 seconds
    const refreshMs = Math.max((expiresIn - 60) * 1000, 10000)

    refreshTimerRef.current = setTimeout(async () => {
      const currentRefreshToken = getRefreshToken()
      if (!currentRefreshToken) return

      try {
        const data = await refreshAccessToken(currentRefreshToken)
        setAccessToken(data.access_token)
        setRefreshToken(data.refresh_token)

        const decoded = decodeTokenPayload(data.access_token)
        if (decoded) {
          setUser({
            userId: decoded.user_id,
            tenantId: decoded.tenant_id,
            role: decoded.role,
          })
          scheduleRefresh(data.expires_in)
        }
      } catch {
        // Refresh failed — force logout
        clearTokens()
        setUser(null)
        if (refreshTimerRef.current) {
          clearTimeout(refreshTimerRef.current)
        }
      }
    }, refreshMs)
  }, [])

  /**
   * On mount: attempt silent re-authentication if a refresh token
   * is available in sessionStorage (e.g. after a page reload).
   */
  useEffect(() => {
    const storedRefresh = getRefreshToken()
    if (!storedRefresh) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const data = await refreshAccessToken(storedRefresh)
        if (cancelled) return

        setAccessToken(data.access_token)
        setRefreshToken(data.refresh_token)

        const decoded = decodeTokenPayload(data.access_token)
        if (decoded) {
          setUser({
            userId: decoded.user_id,
            tenantId: decoded.tenant_id,
            role: decoded.role,
          })
          scheduleRefresh(data.expires_in)
        }
      } catch {
        // Stored refresh token is expired/invalid — clear it
        if (!cancelled) {
          clearTokens()
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [scheduleRefresh])

  /** Clean up refresh timer on unmount. */
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
    }
  }, [])

  /**
   * Process a successful auth response (login or register).
   * Sets tokens in memory, decodes user info, schedules refresh.
   */
  const handleAuthSuccess = useCallback(
    (data) => {
      setAccessToken(data.access_token)
      setRefreshToken(data.refresh_token)

      const decoded = decodeTokenPayload(data.access_token)
      if (decoded) {
        setUser({
          userId: decoded.user_id,
          tenantId: decoded.tenant_id,
          role: decoded.role,
        })
      }

      scheduleRefresh(data.expires_in)
    },
    [scheduleRefresh],
  )

  /**
   * Log in with email, password, and tenant ID.
   *
   * @param {string} email
   * @param {string} password
   * @param {string} tenantId
   * @throws {Error} with user-facing message on failure
   */
  const login = useCallback(
    async (email, password, tenantId) => {
      setIsLoading(true)
      try {
        const data = await apiLogin(email, password, tenantId)
        handleAuthSuccess(data)
        navigate('/')
      } finally {
        setIsLoading(false)
      }
    },
    [handleAuthSuccess, navigate],
  )

  /**
   * Register a new user.
   *
   * @param {string} email
   * @param {string} password
   * @param {string} tenantId
   * @param {string} [role='viewer']
   * @throws {Error} with user-facing message on failure
   */
  const registerUser = useCallback(
    async (email, password, tenantId, role = 'viewer') => {
      setIsLoading(true)
      try {
        const data = await apiRegister(email, password, tenantId, role)
        handleAuthSuccess(data)
        navigate('/')
      } finally {
        setIsLoading(false)
      }
    },
    [handleAuthSuccess, navigate],
  )

  /**
   * Log out — clear all auth state and redirect to login.
   */
  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
    }
    navigate('/login')
  }, [navigate])

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register: registerUser,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
