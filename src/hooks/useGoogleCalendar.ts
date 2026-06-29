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
import { parseHHMM, toIso8601, fromISO } from '../lib/date'
import type { PreviewDay } from './usePlanningPreview'

export const publishedWeeksKey = ['publishedWeeks'] as const

export interface PublishInput {
  days: PreviewDay[]
  weekStartISO: string
  weekPresetId: string | null | undefined
  token: string
  timeZone: string
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

async function runPublish(input: PublishInput): Promise<PublishResult> {
  const { days, weekStartISO, weekPresetId, token, timeZone } = input

  const { data: week, error: weekError } = await supabase
    .from('published_weeks')
    .insert({ week_start: weekStartISO, week_preset_id: weekPresetId ?? null })
    .select('id')
    .single()

  if (weekError) throw new Error(weekError.message)

  type Task = { block: PreviewDay['blocks'][number]; date: Date; dayDate: string }
  const tasks: Task[] = days.flatMap((day) =>
    day.blocks.map((block) => ({ block, date: day.date, dayDate: day.dateISO }))
  )

  const results = await Promise.allSettled(
    tasks.map(async ({ block, date, dayDate }) => {
      const startDt = parseHHMM(block.startTime, date)
      const endDt = parseHHMM(block.endTime, date)

      const event = await createEvent(token, 'primary', {
        summary: block.displayTitle,
        description: buildEventDescription(block.notes, block.subTasks),
        start: { dateTime: toIso8601(startDt), timeZone },
        end: { dateTime: toIso8601(endDt), timeZone },
      })

      await supabase.from('published_events').insert({
        published_week_id: week.id,
        google_calendar_event_id: event.id,
        block_id: block.blockId,
        day_date: dayDate,
        title: event.summary,
        start_time: block.startTime,
        end_time: block.endTime,
      })

      return { dayDate, title: block.displayTitle }
    })
  )

  const failures: PublishFailure[] = results
    .map((r, i) => ({ r, task: tasks[i] }))
    .filter(({ r }) => r.status === 'rejected')
    .map(({ r, task }) => ({
      dayDate: task.dayDate,
      title: task.block.displayTitle,
      error: r.status === 'rejected' ? String(r.reason) : '',
    }))

  return {
    publishedWeekId: week.id,
    successCount: results.filter((r) => r.status === 'fulfilled').length,
    failures,
  }
}

export function usePublishWeek() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: runPublish,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: publishedWeeksKey })
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
  return useMutation({
    mutationFn: ({ token, calendarId, eventId, patch }: UpdateEventInput) =>
      updateEvent(token, calendarId, eventId, patch),
  })
}

interface DeleteEventInput {
  token: string
  calendarId: string
  eventId: string
}

export function useDeleteCalendarEvent() {
  return useMutation({
    mutationFn: ({ token, calendarId, eventId }: DeleteEventInput) =>
      deleteEvent(token, calendarId, eventId),
  })
}

export function useCalendarEventsForWeek(weekStartISO: string | null) {
  const { session } = useAuth()
  const token = getGoogleAccessToken(session)

  return useQuery({
    queryKey: ['calendarEvents', weekStartISO],
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
