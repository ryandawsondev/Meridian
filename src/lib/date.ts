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
