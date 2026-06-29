import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toISO } from '../lib/date'
import type { DbPublishedWeek } from '../types/db'

export const HISTORY_MONTHS_STEP = 3

export function usePublishedHistory(monthsBack: number) {
  return useQuery({
    queryKey: ['publishedHistory', monthsBack],
    queryFn: async (): Promise<DbPublishedWeek[]> => {
      const from = new Date()
      from.setMonth(from.getMonth() - monthsBack)
      from.setDate(1)
      from.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('published_weeks')
        .select('*')
        .gte('week_start', toISO(from))
        .order('week_start', { ascending: false })

      if (error) throw new Error(error.message)
      return data ?? []
    },
    placeholderData: (prev) => prev,
  })
}
