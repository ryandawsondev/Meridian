import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AppShell from './components/layout/AppShell'
import SignInPage from './pages/SignInPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import PlanningPage from './pages/PlanningPage'
import PresetsPage from './pages/PresetsPage'
import PreviewPage from './pages/PreviewPage'
import HistoryPage from './pages/HistoryPage'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route
            path="/planning"
            element={
              <ProtectedRoute>
                <AppShell>
                  <PlanningPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/presets"
            element={
              <ProtectedRoute>
                <AppShell>
                  <PresetsPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/preview"
            element={
              <ProtectedRoute>
                <AppShell>
                  <PreviewPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <AppShell>
                  <HistoryPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/planning" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
