import { useMemo } from 'react'
import { getWeekStart, addDays, toISO, fromISO, formatWeekLabel, getWeekDates } from '../lib/date'

export function useCurrentAndNextWeek() {
  return useMemo(() => {
    const thisWeekStart = getWeekStart(new Date())
    const nextWeekStart = addDays(thisWeekStart, 7)
    return {
      thisWeek: toISO(thisWeekStart),
      nextWeek: toISO(nextWeekStart),
    }
  }, [])
}

export function useWeekRange(weekStartISO: string | null) {
  return useMemo(() => {
    if (!weekStartISO) return null
    const weekStart = fromISO(weekStartISO)
    const weekEnd = addDays(weekStart, 6)
    return {
      weekStart,
      weekEnd,
      weekStartISO,
      weekEndISO: toISO(weekEnd),
      label: formatWeekLabel(weekStart),
      dates: getWeekDates(weekStart),
    }
  }, [weekStartISO])
}
