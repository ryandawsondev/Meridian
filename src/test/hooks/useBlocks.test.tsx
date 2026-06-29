import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useCreateBlock, useUpdateBlock, useDeleteBlock } from '../../hooks/useBlocks'
import { fixtures } from '../mocks/handlers'

// ─── Supabase mock ────────────────────────────────────────────────────────────

const mockChain = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
}

;(['select', 'insert', 'update', 'delete', 'eq'] as const).forEach((m) => {
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
  ;(['select', 'insert', 'update', 'delete', 'eq'] as const).forEach((m) => {
    mockChain[m].mockReturnValue(mockChain)
  })
})

const createInput = {
  dayPresetId: 'preset-1',
  title: 'Morning Routine',
  startTime: '07:00',
  endTime: '08:00',
  colour: '#4f46e5',
  isVariable: false,
  order: 0,
}

describe('useCreateBlock', () => {
  it('inserts with snake_case fields and returns mapped block', async () => {
    mockChain.single.mockResolvedValueOnce({ data: fixtures.block, error: null })

    const { result } = renderHook(() => useCreateBlock(), { wrapper: createWrapper() })
    let block: unknown
    await act(async () => {
      block = await result.current.mutateAsync(createInput)
    })

    expect((block as { startTime: string }).startTime).toBe('07:00')
    expect((block as { isVariable: boolean }).isVariable).toBe(false)

    expect(mockChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        day_preset_id: 'preset-1',
        start_time: '07:00',
        end_time: '08:00',
        is_variable: false,
      })
    )
  })

  it('throws on error', async () => {
    mockChain.single.mockResolvedValueOnce({ data: null, error: { message: 'Insert error' } })

    const { result } = renderHook(() => useCreateBlock(), { wrapper: createWrapper() })
    await expect(act(() => result.current.mutateAsync(createInput))).rejects.toThrow('Insert error')
  })
})

describe('useUpdateBlock', () => {
  it('maps camelCase fields to snake_case before update', async () => {
    mockChain.eq.mockResolvedValueOnce({ data: null, error: null })

    const { result } = renderHook(() => useUpdateBlock(), { wrapper: createWrapper() })
    await act(async () => {
      await result.current.mutateAsync({ id: 'block-1', startTime: '09:00', isVariable: true })
    })

    expect(mockChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ start_time: '09:00', is_variable: true })
    )
  })
})

describe('useDeleteBlock', () => {
  it('deletes block by id', async () => {
    mockChain.eq.mockResolvedValueOnce({ data: null, error: null })

    const { result } = renderHook(() => useDeleteBlock(), { wrapper: createWrapper() })
    await act(async () => {
      await result.current.mutateAsync('block-1')
    })

    expect(mockChain.delete).toHaveBeenCalled()
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'block-1')
  })
})
