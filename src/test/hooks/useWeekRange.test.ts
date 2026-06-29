import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWeekRange, useCurrentAndNextWeek } from '../../hooks/useWeekRange'
import { toISO, getWeekStart, addDays } from '../../lib/date'

describe('useWeekRange', () => {
  it('returns null when weekStartISO is null', () => {
    const { result } = renderHook(() => useWeekRange(null))
    expect(result.current).toBeNull()
  })

  it('returns correct week data for a given ISO string', () => {
    const { result } = renderHook(() => useWeekRange('2024-06-24'))
    expect(result.current).not.toBeNull()
    expect(result.current!.weekStartISO).toBe('2024-06-24')
    expect(result.current!.weekEndISO).toBe('2024-06-30')
    expect(result.current!.dates).toHaveLength(7)
    expect(result.current!.label).toContain('24 Jun')
    expect(result.current!.label).toContain('30 Jun')
  })

  it('dates array runs Mon to Sun', () => {
    const { result } = renderHook(() => useWeekRange('2024-06-24'))
    const dates = result.current!.dates
    expect(toISO(dates[0])).toBe('2024-06-24') // Mon
    expect(toISO(dates[6])).toBe('2024-06-30') // Sun
  })
})

describe('useCurrentAndNextWeek', () => {
  it('returns two valid ISO week starts', () => {
    const { result } = renderHook(() => useCurrentAndNextWeek())
    const { thisWeek, nextWeek } = result.current

    // Both should be Mondays
    const thisMonday = toISO(getWeekStart(new Date()))
    const nextMonday = toISO(addDays(getWeekStart(new Date()), 7))

    expect(thisWeek).toBe(thisMonday)
    expect(nextWeek).toBe(nextMonday)
  })
})
