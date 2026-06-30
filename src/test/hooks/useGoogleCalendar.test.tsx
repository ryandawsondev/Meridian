import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { usePublishWeek, useUpdateCalendarEvent } from '../../hooks/useGoogleCalendar'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    session: { provider_token: 'test-token', user: { id: 'u1' } },
    loading: false,
    isAuthenticated: true,
  })),
}))

// ─── Wrapper ──────────────────────────────────────────────────────────────────

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    )
  }
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BASE = 'https://test.supabase.co/rest/v1'
const GCAL = 'https://www.googleapis.com/calendar/v3/calendars'

const mockPreviewDay = {
  dayName: 'monday' as const,
  date: new Date(2024, 5, 24),
  dateISO: '2024-06-24',
  label: 'Monday 24 Jun',
  shortLabel: 'Mon',
  blocks: [
    {
      blockId: 'block-1',
      originalTitle: 'Deep Work',
      displayTitle: 'Deep Work',
      startTime: '09:00',
      endTime: '12:00',
      colour: '#6366f1',
      isVariable: false,
    },
  ],
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('usePublishWeek', () => {
  it('exposes mutateAsync', () => {
    const { result } = renderHook(() => usePublishWeek(), { wrapper: makeWrapper() })
    expect(result.current.mutateAsync).toBeDefined()
    expect(result.current.isPending).toBe(false)
  })

  it('mutates successfully when all API calls succeed', async () => {
    server.use(
      http.post(`${BASE}/published_weeks`, () =>
        HttpResponse.json(
          { id: 'pw-1', user_id: 'u1', week_start: '2024-06-24', week_preset_id: null },
          { status: 201 }
        )
      ),
      http.post(`${BASE}/published_events`, () => new HttpResponse(null, { status: 201 })),
      http.post(`${GCAL}/primary/events`, () =>
        HttpResponse.json(
          { id: 'gcal-1', summary: 'Deep Work', start: { dateTime: '' }, end: { dateTime: '' } },
          { status: 200 }
        )
      )
    )

    const { result } = renderHook(() => usePublishWeek(), { wrapper: makeWrapper() })

    let publishResult: Awaited<ReturnType<typeof result.current.mutateAsync>> | undefined
    await act(async () => {
      publishResult = await result.current.mutateAsync({
        days: [mockPreviewDay],
        weekStartISO: '2024-06-24',
        weekPresetId: null,
        token: 'test-token',
        timeZone: 'UTC',
        userId: 'u1',
      })
    })

    expect(publishResult?.successCount).toBe(1)
    expect(publishResult?.failures).toHaveLength(0)
    expect(publishResult?.publishedWeekId).toBe('pw-1')
  })
})

describe('useUpdateCalendarEvent', () => {
  it('calls updateEvent and returns updated data', async () => {
    server.use(
      http.patch(`${GCAL}/primary/events/evt-1`, () =>
        HttpResponse.json({
          id: 'evt-1',
          summary: 'Updated',
          start: { dateTime: '' },
          end: { dateTime: '' },
        })
      )
    )

    const { result } = renderHook(() => useUpdateCalendarEvent(), { wrapper: makeWrapper() })

    await act(async () => {
      await result.current.mutateAsync({
        token: 'test-token',
        calendarId: 'primary',
        eventId: 'evt-1',
        patch: { summary: 'Updated' },
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.summary).toBe('Updated')
  })
})
