import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useUserSettings, useUpdateUserSettings } from '../../hooks/useUserSettings'
import { fixtures } from '../mocks/handlers'

// ─── Supabase mock ────────────────────────────────────────────────────────────

const mockChain = {
  select: vi.fn(),
  upsert: vi.fn(),
  maybeSingle: vi.fn(),
}

;(['select'] as const).forEach((m) => {
  mockChain[m].mockReturnValue(mockChain)
})

vi.mock('../../lib/supabase', () => ({
  supabase: { from: vi.fn(() => mockChain) },
}))

// ─── Test wrapper ─────────────────────────────────────────────────────────────

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockChain.select.mockReturnValue(mockChain)
})

describe('useUserSettings', () => {
  it('returns mapped settings when row exists', async () => {
    mockChain.maybeSingle.mockResolvedValueOnce({ data: fixtures.userSettings, error: null })

    const { result } = renderHook(() => useUserSettings(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual({
      userId: 'user-123',
      defaultWeekPresetId: 'week-1',
      preferredView: 'week',
    })
  })

  it('returns null when no settings row exists', async () => {
    mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: null })

    const { result } = renderHook(() => useUserSettings(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })

  it('exposes error on supabase failure', async () => {
    mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'RLS denied' } })

    const { result } = renderHook(() => useUserSettings(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as Error).message).toBe('RLS denied')
  })
})

describe('useUpdateUserSettings', () => {
  it('maps camelCase to snake_case and calls upsert', async () => {
    mockChain.upsert.mockResolvedValueOnce({ data: null, error: null })

    const { result } = renderHook(() => useUpdateUserSettings(), { wrapper: createWrapper() })
    await act(async () => {
      await result.current.mutateAsync({ preferredView: 'day', defaultWeekPresetId: 'week-1' })
    })

    expect(mockChain.upsert).toHaveBeenCalledWith({
      preferred_view: 'day',
      default_week_preset_id: 'week-1',
    })
  })
})
