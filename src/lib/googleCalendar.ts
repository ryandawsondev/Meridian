const GCAL_BASE = 'https://www.googleapis.com/calendar/v3/calendars'

export interface CalendarEventInput {
  summary: string
  description?: string
  start: { dateTime: string; timeZone: string }
  end: { dateTime: string; timeZone: string }
}

export interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: { dateTime: string }
  end: { dateTime: string }
}

interface CalendarEventList {
  items: CalendarEvent[]
}

async function gcalFetch<T>(
  method: string,
  url: string,
  token: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body != null ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Google Calendar API error ${res.status}: ${text}`)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function buildEventDescription(
  notes?: string,
  subTasks?: { title: string; notes?: string }[]
): string | undefined {
  const parts: string[] = []
  if (notes) parts.push(notes)
  if (subTasks?.length) {
    if (parts.length) parts.push('')
    parts.push('Sub-tasks:')
    subTasks.forEach((st) => {
      parts.push(`• ${st.title}`)
      if (st.notes) parts.push(`  ${st.notes}`)
    })
  }
  return parts.length ? parts.join('\n') : undefined
}

export async function createEvent(
  token: string,
  calendarId: string,
  event: CalendarEventInput
): Promise<CalendarEvent> {
  return gcalFetch<CalendarEvent>(
    'POST',
    `${GCAL_BASE}/${encodeURIComponent(calendarId)}/events`,
    token,
    event
  )
}

export async function updateEvent(
  token: string,
  calendarId: string,
  eventId: string,
  patch: Partial<CalendarEventInput>
): Promise<CalendarEvent> {
  return gcalFetch<CalendarEvent>(
    'PATCH',
    `${GCAL_BASE}/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    token,
    patch
  )
}

export async function deleteEvent(
  token: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  return gcalFetch<void>(
    'DELETE',
    `${GCAL_BASE}/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    token
  )
}

export async function getEventsForWeek(
  token: string,
  calendarId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin: weekStart.toISOString(),
    timeMax: weekEnd.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
  })
  const url = `${GCAL_BASE}/${encodeURIComponent(calendarId)}/events?${params}`
  const data = await gcalFetch<CalendarEventList>('GET', url, token)
  return data.items ?? []
}
