import { Navigate, Route, Routes } from 'react-router-dom'
import { Provider } from 'react-redux'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { HomePage } from './pages/HomePage'
import { DashboardPage } from './pages/DashboardPage'
import { ScorerPage } from './pages/ScorerPage'
import { BuilderPage } from './pages/BuilderPage'
import { InterviewSetupPage } from './pages/InterviewSetupPage'
import { InterviewRunPage } from './pages/InterviewRunPage'
import { InterviewReportPage } from './pages/InterviewReportPage'
import { RoadmapsPage } from './pages/RoadmapsPage'
import { PricingPage } from './pages/PricingPage'
import { TailorPage } from './pages/TailorPage'
import { ScoreHistoryPage } from './pages/ScoreHistoryPage'
import { TailorHistoryPage } from './pages/TailorHistoryPage'
import { RoadmapHistoryPage } from './pages/RoadmapHistoryPage'
import { AdminLayout } from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminPayments from './pages/admin/AdminPayments'
import AdminMonitor from './pages/admin/AdminMonitor'
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
                <BuilderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/new"
            element={
              <ProtectedRoute>
                <InterviewSetupPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/:id/run"
            element={
              <ProtectedRoute>
                <InterviewRunPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/:id/report"
            element={
              <ProtectedRoute>
                <InterviewReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roadmaps"
            element={
              <ProtectedRoute>
                <RoadmapsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tailor"
            element={
              <ProtectedRoute>
                <TailorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pricing"
            element={
              <ProtectedRoute>
                <PricingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scores/history"
            element={
              <ProtectedRoute>
                <ScoreHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tailor/history"
            element={
              <ProtectedRoute>
                <TailorHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roadmaps/history"
            element={
              <ProtectedRoute>
                <RoadmapHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="monitor" element={<AdminMonitor />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Provider>
  )
}
