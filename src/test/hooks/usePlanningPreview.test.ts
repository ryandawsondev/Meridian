import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePlanningPreview } from '../../hooks/usePlanningPreview'
import { usePlanningStore } from '../../stores/planningStore'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../hooks/usePresets', () => ({
  useWeekPresets: vi.fn(() => ({
    data: [
      {
        id: 'wp-1',
        name: 'Work Week',
        days: { monday: 'dp-1', tuesday: 'dp-1' },
      },
    ],
  })),
  useDayPresets: vi.fn(() => ({
    data: [
      {
        id: 'dp-1',
        name: 'Work Day',
        blocks: [
          {
            id: 'b-1',
            title: 'Deep Work',
            startTime: '09:00',
            endTime: '12:00',
            colour: '#6366f1',
            isVariable: false,
          },
          {
            id: 'b-2',
            title: 'Time to Be Productive',
            startTime: '13:00',
            endTime: '15:00',
            colour: '#f59e0b',
            isVariable: true,
          },
        ],
      },
    ],
  })),
}))

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  usePlanningStore.getState().clearSession()
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('usePlanningPreview', () => {
  it('returns null when no week is selected', () => {
    const { result } = renderHook(() => usePlanningPreview())
    expect(result.current).toBeNull()
  })

  it('returns 7 days', () => {
    usePlanningStore.getState().setWeekPresetId('wp-1')
    usePlanningStore.getState().setTargetWeekStart('2024-06-24')

    const { result } = renderHook(() => usePlanningPreview())
    expect(result.current).toHaveLength(7)
  })

  it('derives blocks from week preset + day presets', () => {
    usePlanningStore.getState().setWeekPresetId('wp-1')
    usePlanningStore.getState().setTargetWeekStart('2024-06-24')

    const { result } = renderHook(() => usePlanningPreview())
    const monday = result.current![0]
    expect(monday.blocks).toHaveLength(2)
    expect(monday.blocks[0].originalTitle).toBe('Deep Work')
    expect(monday.blocks[1].originalTitle).toBe('Time to Be Productive')
  })

  it('uses filled block title for variable blocks', () => {
    usePlanningStore.getState().setWeekPresetId('wp-1')
    usePlanningStore.getState().setTargetWeekStart('2024-06-24')
    usePlanningStore.getState().setFilledBlock('b-2', {
      blockId: 'b-2',
      title: 'Ukrainian study',
      notes: 'Vocab chapter 3',
    })

    const { result } = renderHook(() => usePlanningPreview())
    const variableBlock = result.current![0].blocks[1]
    expect(variableBlock.displayTitle).toBe('Ukrainian study')
    expect(variableBlock.notes).toBe('Vocab chapter 3')
  })

  it('falls back to originalTitle when variable block not filled', () => {
    usePlanningStore.getState().setWeekPresetId('wp-1')
    usePlanningStore.getState().setTargetWeekStart('2024-06-24')

    const { result } = renderHook(() => usePlanningPreview())
    const variableBlock = result.current![0].blocks[1]
    expect(variableBlock.displayTitle).toBe('Time to Be Productive')
    expect(variableBlock.isVariable).toBe(true)
  })

  it('empty day when day preset not assigned', () => {
    usePlanningStore.getState().setWeekPresetId('wp-1')
    usePlanningStore.getState().setTargetWeekStart('2024-06-24')

    const { result } = renderHook(() => usePlanningPreview())
    // Wednesday has no day preset assigned in mock
    const wednesday = result.current![2]
    expect(wednesday.blocks).toHaveLength(0)
  })

  it('blank week (null weekPresetId) returns 7 empty days', () => {
    usePlanningStore.getState().setWeekPresetId(null)
    usePlanningStore.getState().setTargetWeekStart('2024-06-24')

    const { result } = renderHook(() => usePlanningPreview())
    expect(result.current).toHaveLength(7)
    expect(result.current!.every((d) => d.blocks.length === 0)).toBe(true)
  })
})
