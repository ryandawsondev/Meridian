import { describe, it, expect } from 'vitest'
import {
  getWeekStart,
  addDays,
  getWeekDates,
  toISO,
  fromISO,
  formatWeekLabel,
  formatDayLabel,
  getDayName,
} from '../../lib/date'

describe('getWeekStart', () => {
  it('returns Monday for a Wednesday input', () => {
    // 2024-06-26 is a Wednesday
    const result = getWeekStart(new Date(2024, 5, 26))
    expect(toISO(result)).toBe('2024-06-24')
  })

  it('returns Monday for a Monday input', () => {
    const result = getWeekStart(new Date(2024, 5, 24))
    expect(toISO(result)).toBe('2024-06-24')
  })

  it('returns previous Monday for a Sunday input', () => {
    // 2024-06-30 is a Sunday
    const result = getWeekStart(new Date(2024, 5, 30))
    expect(toISO(result)).toBe('2024-06-24')
  })

  it('sets time to midnight', () => {
    const result = getWeekStart(new Date(2024, 5, 26, 15, 30))
    expect(result.getHours()).toBe(0)
    expect(result.getMinutes()).toBe(0)
    expect(result.getSeconds()).toBe(0)
  })
})

describe('addDays', () => {
  it('adds positive days', () => {
    const d = new Date(2024, 5, 24)
    expect(toISO(addDays(d, 6))).toBe('2024-06-30')
  })

  it('adds zero days returns same date', () => {
    const d = new Date(2024, 5, 24)
    expect(toISO(addDays(d, 0))).toBe('2024-06-24')
  })

  it('does not mutate original', () => {
    const d = new Date(2024, 5, 24)
    addDays(d, 3)
    expect(toISO(d)).toBe('2024-06-24')
  })
})

describe('getWeekDates', () => {
  it('returns 7 dates starting from weekStart', () => {
    const start = new Date(2024, 5, 24) // Monday
    const dates = getWeekDates(start)
    expect(dates).toHaveLength(7)
    expect(toISO(dates[0])).toBe('2024-06-24') // Mon
    expect(toISO(dates[6])).toBe('2024-06-30') // Sun
  })
})

describe('toISO / fromISO', () => {
  it('toISO returns YYYY-MM-DD', () => {
    expect(toISO(new Date(2024, 5, 5))).toBe('2024-06-05')
  })

  it('fromISO parses local midnight', () => {
    const d = fromISO('2024-06-05')
    expect(d.getFullYear()).toBe(2024)
    expect(d.getMonth()).toBe(5)
    expect(d.getDate()).toBe(5)
    expect(d.getHours()).toBe(0)
  })

  it('round-trips without offset shift', () => {
    const iso = '2024-01-15'
    expect(toISO(fromISO(iso))).toBe(iso)
  })
})

describe('formatWeekLabel', () => {
  it('returns readable range', () => {
    const start = new Date(2024, 5, 24)
    const label = formatWeekLabel(start)
    expect(label).toContain('24 Jun')
    expect(label).toContain('30 Jun')
    expect(label).toContain('–')
  })
})

describe('formatDayLabel', () => {
  it('returns weekday and date', () => {
    const label = formatDayLabel(new Date(2024, 5, 24))
    expect(label).toContain('Monday')
    expect(label).toContain('24')
    expect(label).toContain('Jun')
  })
})

describe('getDayName', () => {
  it('returns correct day names', () => {
    expect(getDayName(new Date(2024, 5, 24))).toBe('monday')
    expect(getDayName(new Date(2024, 5, 25))).toBe('tuesday')
    expect(getDayName(new Date(2024, 5, 29))).toBe('saturday')
    expect(getDayName(new Date(2024, 5, 30))).toBe('sunday')
  })
})
