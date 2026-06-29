import { useMemo } from 'react'
import { getWeekStart, getWeekEnd } from '../lib/date'

export function useWeekRange(date: Date = new Date()) {
  return useMemo(
    () => ({
      start: getWeekStart(date),
      end: getWeekEnd(date),
    }),
    [date]
  )
}
