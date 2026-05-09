/**
 * ProtectedRoute — auth guard component.
 *
 * Wraps child routes and redirects to /login if user is not authenticated.
 * Shows a loading spinner while auth state is being verified.
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../shared/LoadingSpinner'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // While auth is being verified, show a centered spinner
  if (isLoading) {
    return (
      <div className="protected-route-loading">
        <LoadingSpinner size="lg" label="Verifying authentication…" />
      </div>
    )
  }

  if (!isAuthenticated) {
    // Preserve the attempted URL so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
