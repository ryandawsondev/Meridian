import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { usePublishedHistory } from '../../hooks/usePublishedHistory'

const BASE = 'https://test.supabase.co/rest/v1'

const mockWeek = {
  id: 'pw-1',
  user_id: 'u1',
  week_start: '2024-06-24',
  week_preset_id: null,
  created_at: '2024-06-24T09:00:00Z',
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children)
  }
}

describe('usePublishedHistory', () => {
  it('is loading initially', () => {
    const { result } = renderHook(() => usePublishedHistory(3), { wrapper: makeWrapper() })
    expect(result.current.isLoading).toBe(true)
  })

  it('returns empty array when no history', async () => {
    const { result } = renderHook(() => usePublishedHistory(3), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('returns published weeks from Supabase', async () => {
    server.use(
      http.get(`${BASE}/published_weeks`, () => HttpResponse.json([mockWeek]))
    )
    const { result } = renderHook(() => usePublishedHistory(3), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].id).toBe('pw-1')
    expect(result.current.data![0].week_start).toBe('2024-06-24')
  })

  it('returns multiple weeks in descending order', async () => {
    const weeks = [
      { ...mockWeek, id: 'pw-2', week_start: '2024-07-01' },
      { ...mockWeek, id: 'pw-1', week_start: '2024-06-24' },
    ]
    server.use(
      http.get(`${BASE}/published_weeks`, () => HttpResponse.json(weeks))
    )
    const { result } = renderHook(() => usePublishedHistory(3), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(2)
    expect(result.current.data![0].id).toBe('pw-2')
  })

  it('throws when Supabase returns error', async () => {
    server.use(
      http.get(`${BASE}/published_weeks`, () =>
        HttpResponse.json({ message: 'permission denied' }, { status: 400 })
      )
    )
    const { result } = renderHook(() => usePublishedHistory(3), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
