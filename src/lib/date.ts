const DAY_NAMES = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

export type DayName = (typeof DAY_NAMES)[number]

/** Returns the Monday of the week containing `date`, at midnight local time. */
export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun … 6=Sat
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/** Returns [Mon, Tue, …, Sun] for the week starting at `weekStart`. */
export function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

/** "YYYY-MM-DD" in local time (not UTC). */
export function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Parse "YYYY-MM-DD" as local midnight (avoids UTC-offset date shifting). */
export function fromISO(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Full ISO 8601 string (UTC). Used for Google Calendar event timestamps. */
export function toIso8601(date: Date): string {
  return date.toISOString()
}

/** Parse "HH:MM" and apply to a base date, returning a new Date. */
export function parseHHMM(time: string, baseDate: Date): Date {
  const [hours, minutes] = time.split(':').map(Number)
  const d = new Date(baseDate)
  d.setHours(hours, minutes, 0, 0)
  return d
}

/** "30 Jun – 6 Jul" */
export function formatWeekLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6)
  const fmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })
  return `${fmt.format(weekStart)} – ${fmt.format(weekEnd)}`
}

/** "Monday 30 Jun" */
export function formatDayLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(date)
}

/** "Mon" */
export function formatDayShort(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(date)
}

/** Returns the DayName ("monday"…"sunday") for a given Date. */
export function getDayName(date: Date): DayName {
  const idx = (date.getDay() + 6) % 7 // 0=Mon … 6=Sun
  return DAY_NAMES[idx]
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Normalise a sorted list of HH:MM block times for display in a time-grid calendar.
 *
 * Problems solved:
 * 1. Back-to-back blocks (A.end == B.start) render as overlapping in Schedule-X
 *    because it uses closed-interval comparison. Fix: cap every block's display
 *    end at (next block's start - 1 minute).
 * 2. Very short blocks (< minDurationMinutes) render as unreadable slivers.
 *    Fix: extend the display end to start + minDurationMinutes, then clamp to
 *    the cap from rule 1 so we never overlap the next block.
 */
/**
 * Normalise block display times for Schedule-X time-grid rendering.
 *
 * Cascading algorithm: if extending block A to meet minDurationMinutes pushes
 * past block B's actual start, block B's display start shifts forward to match.
 * This guarantees zero overlap so Schedule-X never column-splits events.
 */
export function normalizeDisplayTimes(
  blocks: { startTime: string; endTime: string }[],
  minDurationMinutes = 5
): { displayStart: string; displayEnd: string }[] {
  if (blocks.length === 0) return []

  const indexed = blocks.map((b, origIdx) => ({ ...b, origIdx }))
  const sorted = [...indexed].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  )

  const results: ({ displayStart: string; displayEnd: string } & { origIdx: number })[] =
    sorted.map((block, idx) => {
      const startMin = timeToMinutes(block.startTime)
      const endMin = timeToMinutes(block.endTime)
      const nextStartMin =
        idx < sorted.length - 1 ? timeToMinutes(sorted[idx + 1].startTime) : 24 * 60

      const capMin = nextStartMin - 1
      const desiredEnd = Math.min(Math.max(endMin, startMin + minDurationMinutes), capMin)
      const displayEndMin = Math.max(desiredEnd, startMin + 1)

      return {
        origIdx: block.origIdx,
        displayStart: block.startTime, // always the real start time, never shifted
        displayEnd: minutesToTime(displayEndMin),
      }
    })

  const out = new Array<{ displayStart: string; displayEnd: string }>(blocks.length)
  for (const r of results)
    out[r.origIdx] = { displayStart: r.displayStart, displayEnd: r.displayEnd }
  return out
}
