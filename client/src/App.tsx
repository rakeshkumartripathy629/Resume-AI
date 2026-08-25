import { Navigate, Route, Routes } from 'react-router-dom'
import { Provider } from 'react-redux'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { HomePage } from './pages/HomePage'
import { DashboardPage } from './pages/DashboardPage'
import { ScorerPage } from './pages/ScorerPage'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { store } from './store'

export default function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scorer"
            element={
              <ProtectedRoute>
                <ScorerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/builder"
            element={
              <ProtectedRoute>
                <ComingSoonPage title="Resume Builder" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/new"
            element={
              <ProtectedRoute>
                <ComingSoonPage title="Mock Interview" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roadmaps"
            element={
              <ProtectedRoute>
                <ComingSoonPage title="Career Roadmap" />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Provider>
  )
}
