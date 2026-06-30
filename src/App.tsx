import { Component, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AppShell from './components/layout/AppShell'
import SignInPage from './pages/SignInPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import PlanningPage from './pages/PlanningPage'
import PresetsPage from './pages/PresetsPage'
import PreviewPage from './pages/PreviewPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'

const queryClient = new QueryClient()

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
          <p className="text-sm text-destructive">Something went wrong.</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm underline underline-offset-4"
          >
            Reload page
          </button>
          <a href="/" className="text-sm text-muted-foreground underline underline-offset-4">
            Go home
          </a>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
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
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <SettingsPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/planning" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="bottom-center" offset={80} richColors />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
