import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsForWeek,
  buildEventDescription,
  type CalendarEventInput,
  type CalendarEvent,
} from '../lib/googleCalendar'
import { getGoogleAccessToken } from '../lib/auth'
import { useAuth } from './useAuth'
import { parseHHMM, toIso8601, fromISO, getWeekEnd } from '../lib/date'
import type { PreviewDay } from './usePlanningPreview'

export interface PublishInput {
  days: PreviewDay[]
  weekStartISO: string
  weekPresetId: string | null | undefined
  token: string
  timeZone: string
  userId: string
  onProgress?: (done: number, total: number) => void
}

export interface PublishFailure {
  dayDate: string
  title: string
  error: string
}

export interface PublishResult {
  publishedWeekId: string
  successCount: number
  failures: PublishFailure[]
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const msg = String(err)
      const isRateLimit =
        msg.includes('429') || (msg.includes('403') && msg.toLowerCase().includes('rate'))
      if (!isRateLimit || attempt === maxRetries) throw err
      await sleep(1000 * (attempt + 1)) // 1s then 2s
    }
  }
  throw new Error('max retries exceeded')
}

async function runPublish(input: PublishInput): Promise<PublishResult> {
  const { days, weekStartISO, weekPresetId, token, timeZone, userId, onProgress } = input

  const { data: week, error: weekError } = await supabase
    .from('published_weeks')
    .insert({ user_id: userId, week_start: weekStartISO, week_preset_id: weekPresetId ?? null })
    .select('id')
    .single()

  if (weekError) throw new Error(weekError.message)

  type Task = { block: PreviewDay['blocks'][number]; date: Date; dayDate: string }
  const tasks: Task[] = days.flatMap((day) =>
    day.blocks.map((block) => ({ block, date: day.date, dayDate: day.dateISO }))
  )

  const failures: PublishFailure[] = []
  let successCount = 0

  // 3 concurrent per batch + 300ms gap + per-request retry keeps throughput ~4 RPS,
  // well under Google's 10 QPS limit. Retry backs off 1s/2s on 429 or rate-limit 403.
  const chunkSize = 3
  for (let i = 0; i < tasks.length; i += chunkSize) {
    if (i > 0) await sleep(300)
    const chunk = tasks.slice(i, i + chunkSize)
    const results = await Promise.allSettled(
      chunk.map(async ({ block, date, dayDate }) => {
        const startDt = parseHHMM(block.startTime, date)
        const endDt = parseHHMM(block.endTime, date)

        const event = await withRetry(() =>
          createEvent(token, 'primary', {
            summary: block.displayTitle,
            description: buildEventDescription(block.notes, block.subTasks),
            start: { dateTime: toIso8601(startDt), timeZone },
            end: { dateTime: toIso8601(endDt), timeZone },
          })
        )

        await supabase.from('published_events').insert({
          published_week_id: week.id,
          google_calendar_event_id: event.id,
          block_id: block.blockId,
          day_date: dayDate,
          title: event.summary,
          start_time: block.startTime,
          end_time: block.endTime,
        })
      })
    )
    results.forEach((r, j) => {
      if (r.status === 'fulfilled') {
        successCount++
      } else {
        const task = chunk[j]
        failures.push({
          dayDate: task.dayDate,
          title: task.block.displayTitle,
          error: String(r.reason),
        })
      }
    })
    onProgress?.(successCount + failures.length, tasks.length)
  }

  return {
    publishedWeekId: week.id,
    successCount,
    failures,
  }
}

export function usePublishWeek() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: runPublish,
    networkMode: 'always',
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publishedHistory'] })
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
    },
  })
}

interface UpdateEventInput {
  token: string
  calendarId: string
  eventId: string
  patch: Partial<CalendarEventInput>
}

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ token, calendarId, eventId, patch }: UpdateEventInput) =>
      updateEvent(token, calendarId, eventId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
    },
  })
}

interface DeleteEventInput {
  token: string
  calendarId: string
  eventId: string
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ token, calendarId, eventId }: DeleteEventInput) =>
      deleteEvent(token, calendarId, eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
    },
  })
}

interface DeleteWeekEventsInput {
  token: string
  weekStartISO: string
  onProgress?: (done: number, total: number) => void
}

export function useDeleteWeekEvents(options?: {
  onSuccess?: (count: number) => void
  onError?: (err: Error) => void
}) {
  const queryClient = useQueryClient()
  return useMutation({
    networkMode: 'always',
    mutationFn: async ({ token, weekStartISO, onProgress }: DeleteWeekEventsInput) => {
      const weekStart = fromISO(weekStartISO)
      const weekEnd = getWeekEnd(weekStart)
      const events = await getEventsForWeek(token, 'primary', weekStart, weekEnd)
      const chunkSize = 3
      const errors: string[] = []
      let doneCount = 0
      for (let i = 0; i < events.length; i += chunkSize) {
        if (i > 0) await sleep(300)
        const chunk = events.slice(i, i + chunkSize)
        const results = await Promise.allSettled(
          chunk.map((event) => withRetry(() => deleteEvent(token, 'primary', event.id)))
        )
        results.forEach((r) => {
          doneCount++
          if (r.status === 'rejected') errors.push(String(r.reason))
        })
        onProgress?.(doneCount, events.length)
      }
      if (errors.length > 0) throw new Error(`${errors.length} event(s) failed to delete`)
      return events.length
    },
    onSuccess: (count, { weekStartISO }) => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents', weekStartISO] })
      options?.onSuccess?.(count)
    },
    onError: (err) => {
      options?.onError?.(err instanceof Error ? err : new Error(String(err)))
    },
  })
}

interface WipeWeekInput {
  token: string
  weekStartISO: string
  publishedWeekId: string
}

export function useWipeWeek() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ token, weekStartISO, publishedWeekId }: WipeWeekInput) => {
      const weekStart = fromISO(weekStartISO)
      const weekEnd = fromISO(weekStartISO)
      weekEnd.setDate(weekEnd.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)

      const events = await getEventsForWeek(token, 'primary', weekStart, weekEnd)
      const chunkSize = 3
      for (let i = 0; i < events.length; i += chunkSize) {
        if (i > 0) await sleep(300)
        const chunk = events.slice(i, i + chunkSize)
        await Promise.allSettled(
          chunk.map((event) => withRetry(() => deleteEvent(token, 'primary', event.id)))
        )
      }

      const { error } = await supabase
        .from('published_weeks')
        .delete()
        .eq('id', publishedWeekId)
      if (error) throw new Error(error.message)
    },
    onSuccess: (_data, { weekStartISO }) => {
      queryClient.invalidateQueries({ queryKey: ['publishedHistory'] })
      queryClient.invalidateQueries({ queryKey: ['calendarEvents', weekStartISO] })
    },
  })
}

export function useCalendarEventsForWeek(weekStartISO: string | null) {
  const { session } = useAuth()
  const token = getGoogleAccessToken(session)

  return useQuery({
    queryKey: ['calendarEvents', weekStartISO, !!token],
    queryFn: async (): Promise<CalendarEvent[]> => {
      if (!token || !weekStartISO) throw new Error('Missing params')
      const weekStart = fromISO(weekStartISO)
      const weekEnd = fromISO(weekStartISO)
      weekEnd.setDate(weekEnd.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)
      return getEventsForWeek(token, 'primary', weekStart, weekEnd)
    },
    enabled: !!token && !!weekStartISO,
  })
}
