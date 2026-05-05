import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import ChatPage from './pages/ChatPage'

/**
 * SupportForge — Root Application Component
 *
 * Phase 3.3: Chat UI with WebSocket streaming replaces scaffold.
 * Subsequent sub-phases will add:
 *   3.4: AdminPage with document upload
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
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
