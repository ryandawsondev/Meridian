import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export type HealthResult = { latencyMs: number }

async function pingSupabase(): Promise<HealthResult> {
  const t0 = performance.now()
  const { error } = await supabase
    .from('user_settings')
    .select('*', { count: 'exact', head: true })
  if (error) throw new Error(error.message)
  return { latencyMs: Math.round(performance.now() - t0) }
}

async function pingGoogleCalendar(token: string): Promise<HealthResult> {
  const t0 = performance.now()
  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=1',
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error(`${res.status}`)
  return { latencyMs: Math.round(performance.now() - t0) }
}

const OPTS = {
  refetchInterval: 60_000,
  staleTime: 50_000,
  retry: 0,
  refetchOnWindowFocus: false,
}

export function useSupabaseHealth(hasSession: boolean) {
  return useQuery({
    queryKey: ['health', 'supabase'],
    queryFn: pingSupabase,
    enabled: hasSession,
    ...OPTS,
  })
}

export function useGoogleCalendarHealth(token: string | null) {
  return useQuery({
    queryKey: ['health', 'googleCalendar', !!token],
    queryFn: () => pingGoogleCalendar(token!),
    enabled: !!token,
    ...OPTS,
  })
}
