/**
 * ProtectedRoute — auth guard component.
 *
 * Wraps child routes and redirects to /login if user is not authenticated.
 * Shows nothing while auth state is loading to prevent flash of protected content.
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // While auth is being verified, render nothing to prevent flash
  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    // Preserve the attempted URL so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
