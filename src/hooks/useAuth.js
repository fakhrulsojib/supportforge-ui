/**
 * useAuth hook — convenience re-export from AuthContext.
 *
 * Separated from AuthContext.jsx to satisfy react-refresh linting
 * (files should export only components OR only non-components).
 */

import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

/**
 * Hook to access auth context.
 * Must be used within an AuthProvider.
 *
 * @returns {{ user: object|null, isAuthenticated: boolean, isLoading: boolean, login: Function, register: Function, logout: Function }}
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
