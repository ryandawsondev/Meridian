import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  useDayPresets,
  useCreateDayPreset,
  useDeleteDayPreset,
  useWeekPresets,
  useCreateWeekPreset,
} from '../../hooks/usePresets'
import { fixtures } from '../mocks/handlers'

// ─── Supabase mock ────────────────────────────────────────────────────────────

const mockChain = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  upsert: vi.fn(),
  delete: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  single: vi.fn(),
  maybeSingle: vi.fn(),
}

// By default all chainable methods return the same chain object
;(['select', 'insert', 'update', 'upsert', 'delete', 'eq'] as const).forEach((m) => {
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

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const dbDayPreset = { ...fixtures.dayPreset, blocks: [fixtures.block] }
const dbWeekPreset = { ...fixtures.weekPreset, week_preset_days: [fixtures.weekPresetDay] }

beforeEach(() => {
  vi.clearAllMocks()
  ;(['select', 'insert', 'update', 'upsert', 'delete', 'eq'] as const).forEach((m) => {
    mockChain[m].mockReturnValue(mockChain)
  })
})

// ─── Day Presets ──────────────────────────────────────────────────────────────

describe('useDayPresets', () => {
  it('returns mapped day presets', async () => {
    mockChain.order.mockResolvedValueOnce({ data: [dbDayPreset], error: null })

    const { result } = renderHook(() => useDayPresets(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [preset] = result.current.data!
    expect(preset.id).toBe('preset-1')
    expect(preset.name).toBe('Work Day')
    expect(preset.blocks[0].startTime).toBe('07:00')
    expect(preset.blocks[0].isVariable).toBe(false)
  })

  it('exposes error when supabase fails', async () => {
    mockChain.order.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } })

    const { result } = renderHook(() => useDayPresets(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as Error).message).toBe('DB error')
  })
})

describe('useCreateDayPreset', () => {
  it('creates a day preset and returns mapped result', async () => {
    mockChain.single.mockResolvedValueOnce({ data: fixtures.dayPreset, error: null })

    const { result } = renderHook(() => useCreateDayPreset(), { wrapper: createWrapper() })
    let created: unknown
    await act(async () => {
      created = await result.current.mutateAsync('Work Day')
    })

    expect((created as { name: string }).name).toBe('Work Day')
    expect((created as { blocks: unknown[] }).blocks).toEqual([])
  })

  it('throws on error', async () => {
    mockChain.single.mockResolvedValueOnce({ data: null, error: { message: 'Insert failed' } })

    const { result } = renderHook(() => useCreateDayPreset(), { wrapper: createWrapper() })
    await expect(
      act(() => result.current.mutateAsync('Bad Preset'))
    ).rejects.toThrow('Insert failed')
  })
})

describe('useDeleteDayPreset', () => {
  it('calls delete with correct id', async () => {
    mockChain.eq.mockResolvedValueOnce({ data: null, error: null })

    const { result } = renderHook(() => useDeleteDayPreset(), { wrapper: createWrapper() })
    await act(async () => {
      await result.current.mutateAsync('preset-1')
    })

    const { supabase } = await import('../../lib/supabase')
    expect(vi.mocked(supabase.from)).toHaveBeenCalledWith('day_presets')
    expect(mockChain.delete).toHaveBeenCalled()
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'preset-1')
  })
})

// ─── Week Presets ─────────────────────────────────────────────────────────────

describe('useWeekPresets', () => {
  it('returns mapped week presets with days', async () => {
    mockChain.order.mockResolvedValueOnce({ data: [dbWeekPreset], error: null })

    const { result } = renderHook(() => useWeekPresets(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [preset] = result.current.data!
    expect(preset.id).toBe('week-1')
    expect(preset.days.monday).toBe('preset-1')
  })
})

describe('useCreateWeekPreset', () => {
  it('creates a week preset', async () => {
    mockChain.single.mockResolvedValueOnce({ data: fixtures.weekPreset, error: null })

    const { result } = renderHook(() => useCreateWeekPreset(), { wrapper: createWrapper() })
    let created: unknown
    await act(async () => {
      created = await result.current.mutateAsync('Standard Week')
    })

    expect((created as { name: string }).name).toBe('Standard Week')
    expect((created as { days: object }).days).toEqual({})
  })
})
