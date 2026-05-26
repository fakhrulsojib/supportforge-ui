import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import ErrorBoundary from './components/shared/ErrorBoundary'
import LoadingSpinner from './components/shared/LoadingSpinner'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const ChatPage = lazy(() => import('./pages/ChatPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const ReviewPage = lazy(() => import('./pages/ReviewPage'))
const PlatformTenantsPage = lazy(() => import('./pages/PlatformTenantsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

/**
 * SupportForge — Root Application Component
 *
 * Phase 3.6: Layout shell (Sidebar, Header), dark mode toggle,
 *            ErrorBoundary, LoadingSpinner, micro-animations.
 */
function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Navigate to="/chat" replace />} />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ChatPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <AdminPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <AnalyticsPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/review"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ReviewPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/platform/tenants"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <PlatformTenantsPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <SettingsPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
