import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import ChatPage from './pages/ChatPage'
import AdminPage from './pages/AdminPage'

/**
 * SupportForge — Root Application Component
 *
 * Phase 3.4: Admin Panel with document upload, ingestion status, model config.
 * Subsequent sub-phases will add:
 *   3.5: AnalyticsPage with dashboard
 *   3.6: Layout shell (Sidebar, Header), dark mode toggle
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
