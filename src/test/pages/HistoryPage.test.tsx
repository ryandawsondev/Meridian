import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import HistoryPage from '../../pages/HistoryPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    session: { provider_token: 'test-token', user: { id: 'u1' } },
    loading: false,
    isAuthenticated: true,
  })),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE = 'https://test.supabase.co/rest/v1'
const GCAL = 'https://www.googleapis.com/calendar/v3/calendars'

const mockWeek = {
  id: 'pw-1',
  user_id: 'u1',
  week_start: '2024-06-24',
  week_preset_id: null,
  created_at: '2024-06-24T09:00:00Z',
}

const mockGcalEvent = {
  id: 'gcal-1',
  summary: 'Morning Routine',
  start: { dateTime: '2024-06-24T07:00:00Z' },
  end: { dateTime: '2024-06-24T08:00:00Z' },
}

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: qc },
      React.createElement(BrowserRouter, { future: { v7_startTransition: true, v7_relativeSplatPath: true } }, children)
    )
  }
}

function renderPage() {
  return render(React.createElement(HistoryPage), { wrapper: makeWrapper() })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('HistoryPage', () => {
  it('shows heading', async () => {
    renderPage()
    expect(screen.getByText('History')).toBeInTheDocument()
  })

  it('shows empty state when no history', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('No published weeks yet')).toBeInTheDocument()
    })
  })

  it('renders week card with label', async () => {
    server.use(
      http.get(`${BASE}/published_weeks`, () => HttpResponse.json([mockWeek]))
    )
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('24 Jun – 30 Jun')).toBeInTheDocument()
    })
  })

  it('shows published date in card', async () => {
    server.use(
      http.get(`${BASE}/published_weeks`, () => HttpResponse.json([mockWeek]))
    )
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/published/i)).toBeInTheDocument()
    })
  })

  it('expands week card to show GCal events', async () => {
    server.use(
      http.get(`${BASE}/published_weeks`, () => HttpResponse.json([mockWeek])),
      http.get(`${GCAL}/:calendarId/events`, () =>
        HttpResponse.json({ items: [mockGcalEvent] })
      )
    )
    renderPage()
    const card = await screen.findByText('24 Jun – 30 Jun')
    fireEvent.click(card.closest('button')!)
    await waitFor(() => {
      expect(screen.getByText('Morning Routine')).toBeInTheDocument()
    })
  })

  it('shows empty events message when GCal returns nothing', async () => {
    server.use(
      http.get(`${BASE}/published_weeks`, () => HttpResponse.json([mockWeek])),
      http.get(`${GCAL}/:calendarId/events`, () =>
        HttpResponse.json({ items: [] })
      )
    )
    renderPage()
    const card = await screen.findByText('24 Jun – 30 Jun')
    fireEvent.click(card.closest('button')!)
    await waitFor(() => {
      expect(screen.getByText('No events found in calendar.')).toBeInTheDocument()
    })
  })

  it('shows load earlier button when weeks exist', async () => {
    server.use(
      http.get(`${BASE}/published_weeks`, () => HttpResponse.json([mockWeek]))
    )
    renderPage()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /load earlier/i })).toBeInTheDocument()
    })
  })

  it('does not show load earlier when no weeks', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText('No published weeks yet')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /load earlier/i })).not.toBeInTheDocument()
  })
})
