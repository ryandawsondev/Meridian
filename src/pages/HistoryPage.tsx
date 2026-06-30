import { useState } from 'react'
import { Calendar, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { usePublishedHistory, HISTORY_MONTHS_STEP } from '../hooks/usePublishedHistory'
import { useCalendarEventsForWeek } from '../hooks/useGoogleCalendar'
import { useAuth } from '../hooks/useAuth'
import { formatWeekLabel, fromISO } from '../lib/date'
import { Button } from '../components/ui/button'
import type { DbPublishedWeek } from '../types/db'
import type { CalendarEvent } from '../lib/googleCalendar'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(dateTime: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(dateTime))
}

function groupEventsByDate(events: CalendarEvent[]): { date: string; events: CalendarEvent[] }[] {
  const map = new Map<string, CalendarEvent[]>()
  for (const event of events) {
    const date = event.start.dateTime.slice(0, 10)
    if (!map.has(date)) map.set(date, [])
    map.get(date)!.push(event)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, evs]) => ({
      date,
      events: evs.sort((a, b) => a.start.dateTime.localeCompare(b.start.dateTime)),
    }))
}

// ─── WeekDetail ───────────────────────────────────────────────────────────────

function WeekDetail({ weekStartISO }: { weekStartISO: string }) {
  const { data: events, isLoading, isError } = useCalendarEventsForWeek(weekStartISO)

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError) {
    return <p className="px-4 py-2 text-sm text-destructive">Failed to load events.</p>
  }

  if (!events || events.length === 0) {
    return <p className="px-4 py-3 text-sm text-muted-foreground">No events found in calendar.</p>
  }

  const groups = groupEventsByDate(events)

  return (
    <div className="flex flex-col gap-3 px-4 pb-3">
      {groups.map(({ date, events: dayEvents }) => (
        <div key={date}>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {new Intl.DateTimeFormat('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
            }).format(fromISO(date))}
          </p>
          <div className="flex flex-col gap-1.5">
            {dayEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-lg border border-input bg-background px-3 py-2"
              >
                <p className="text-sm font-medium">{event.summary}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(event.start.dateTime)} – {formatTime(event.end.dateTime)}
                </p>
                {event.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {event.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── WeekCard ─────────────────────────────────────────────────────────────────

function WeekCard({ week }: { week: DbPublishedWeek }) {
  const [expanded, setExpanded] = useState(false)
  const label = formatWeekLabel(fromISO(week.week_start))

  return (
    <div className="overflow-hidden rounded-xl border border-input bg-card">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/50"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">
              Published{' '}
              {new Intl.DateTimeFormat('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }).format(new Date(week.created_at))}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {expanded && <WeekDetail weekStartISO={week.week_start} />}
    </div>
  )
}

// ─── HistoryPage ──────────────────────────────────────────────────────────────

const INITIAL_MONTHS = HISTORY_MONTHS_STEP

export default function HistoryPage() {
  const [monthsBack, setMonthsBack] = useState(INITIAL_MONTHS)
  const { data: weeks, isLoading, isError } = usePublishedHistory(monthsBack)
  const { session } = useAuth()

  if (!session) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 py-16">
        <p className="text-sm text-muted-foreground">Sign in to view history.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <h1 className="mb-1 text-xl font-semibold tracking-tight">History</h1>
      <p className="mb-6 text-xs text-muted-foreground">Past published weeks</p>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && <p className="text-sm text-destructive">Failed to load history.</p>}

      {!isLoading && !isError && weeks && weeks.length === 0 && (
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-input">
          <p className="text-sm text-muted-foreground">No published weeks yet</p>
        </div>
      )}

      {weeks && weeks.length > 0 && (
        <>
          <div className="flex flex-col gap-3">
            {weeks.map((week) => (
              <WeekCard key={week.id} week={week} />
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMonthsBack((m) => m + HISTORY_MONTHS_STEP)}
            >
              Load earlier
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
