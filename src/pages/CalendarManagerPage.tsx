import { useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../hooks/useAuth'
import { getGoogleAccessToken, signIn } from '../lib/auth'
import { useCalendarEventsForWeek, useDeleteWeekEvents } from '../hooks/useGoogleCalendar'
import { getWeekStart, addDays, fromISO, toISO, formatWeekLabel } from '../lib/date'
import { Button } from '../components/ui/button'
import { AnimatedCircularProgressBar } from '../components/ui/animated-circular-progress-bar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog'
import type { CalendarEvent } from '../lib/googleCalendar'

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

export default function CalendarManagerPage() {
  const { session } = useAuth()
  const token = getGoogleAccessToken(session)
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))

  const weekStartISO = toISO(weekStart)
  const weekLabel = formatWeekLabel(weekStart)

  const { data: events, isLoading, isError, refetch, isFetching } =
    useCalendarEventsForWeek(weekStartISO)
  const [deleteProgress, setDeleteProgress] = useState<{ done: number; total: number } | null>(null)
  const { mutate: deleteWeek, isPending: isDeleting } = useDeleteWeekEvents({
    onSuccess: (count) => { setDeleteProgress(null); toast.success(`Deleted ${count} event${count === 1 ? '' : 's'}`) },
    onError: (err) => { setDeleteProgress(null); toast.error(err instanceof Error ? err.message : 'Delete failed') },
  })

  const prevWeek = () => setWeekStart((d) => addDays(d, -7))
  const nextWeek = () => setWeekStart((d) => addDays(d, 7))

  if (!session) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 py-16">
        <p className="text-sm text-muted-foreground">Sign in to manage calendar.</p>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-4 py-16">
        <p className="text-sm text-muted-foreground">Google session expired.</p>
        <Button variant="outline" size="sm" onClick={() => void signIn()}>
          Reconnect
        </Button>
      </div>
    )
  }

  const groups = events ? groupEventsByDate(events) : []

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-xs text-muted-foreground">Manage Google Calendar events</p>
        </div>
        <button
          onClick={() => void refetch()}
          disabled={isFetching}
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
          aria-label="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={prevWeek}
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted"
          aria-label="Previous week"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium">{weekLabel}</span>
        <button
          onClick={nextWeek}
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted"
          aria-label="Next week"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 py-4">
          <p className="text-sm text-destructive">Failed to load events.</p>
          <button
            onClick={() => void refetch()}
            className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && groups.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-input px-6 py-16 text-center">
          <p className="text-sm font-medium">No events this week</p>
          <p className="text-xs text-muted-foreground">Google Calendar is clear for this week.</p>
        </div>
      )}

      {groups.length > 0 && (
        <>
          <div className="flex flex-col gap-4">
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

          <div className="mt-6 flex justify-center">
            {isDeleting ? (
              <div className="flex flex-col items-center gap-2">
                <AnimatedCircularProgressBar
                  value={deleteProgress?.done ?? 0}
                  max={deleteProgress?.total ?? (events?.length ?? 1)}
                  min={0}
                  gaugePrimaryColor="hsl(var(--destructive))"
                  gaugeSecondaryColor="hsl(var(--muted))"
                  className="size-20 text-sm font-semibold"
                />
                <p className="text-xs text-muted-foreground">
                  {deleteProgress
                    ? `Deleting ${deleteProgress.done} of ${deleteProgress.total}…`
                    : 'Deleting…'}
                </p>
              </div>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete all {events?.length} event{events?.length === 1 ? '' : 's'} this week
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete all events for {weekLabel}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all {events?.length} Google Calendar event
                      {events?.length === 1 ? '' : 's'} for this week. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => deleteWeek({ token, weekStartISO, onProgress: (done, total) => setDeleteProgress({ done, total }) })}
                    >
                      Delete all
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </>
      )}
    </div>
  )
}
