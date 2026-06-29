import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PlanningPage from './pages/PlanningPage'
import PresetsPage from './pages/PresetsPage'
import PreviewPage from './pages/PreviewPage'
import HistoryPage from './pages/HistoryPage'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/planning" replace />} />
          <Route path="/planning" element={<PlanningPage />} />
          <Route path="/presets" element={<PresetsPage />} />
          <Route path="/preview" element={<PreviewPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
