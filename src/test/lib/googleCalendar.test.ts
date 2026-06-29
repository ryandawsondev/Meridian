import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsForWeek,
  buildEventDescription,
} from '../../lib/googleCalendar'

const GCAL = 'https://www.googleapis.com/calendar/v3/calendars'
const TOKEN = 'test-token-abc'

const mockEvent = {
  id: 'evt-1',
  summary: 'Deep Work',
  description: 'Focus time',
  start: { dateTime: '2024-06-24T09:00:00Z' },
  end: { dateTime: '2024-06-24T12:00:00Z' },
}

describe('buildEventDescription', () => {
  it('returns undefined when no notes or subtasks', () => {
    expect(buildEventDescription()).toBeUndefined()
    expect(buildEventDescription(undefined, [])).toBeUndefined()
  })

  it('returns notes only', () => {
    expect(buildEventDescription('Focus time')).toBe('Focus time')
  })

  it('returns subtasks only', () => {
    const result = buildEventDescription(undefined, [{ title: 'Task A' }])
    expect(result).toContain('Sub-tasks:')
    expect(result).toContain('• Task A')
  })

  it('combines notes and subtasks with blank line separator', () => {
    const result = buildEventDescription('Focus time', [
      { title: 'Task A', notes: 'Do this' },
      { title: 'Task B' },
    ])
    expect(result).toContain('Focus time')
    expect(result).toContain('Sub-tasks:')
    expect(result).toContain('• Task A')
    expect(result).toContain('  Do this')
    expect(result).toContain('• Task B')
  })
})

describe('createEvent', () => {
  beforeEach(() => {
    server.use(
      http.post(`${GCAL}/primary/events`, () => HttpResponse.json(mockEvent, { status: 200 }))
    )
  })

  it('returns the created event', async () => {
    const result = await createEvent(TOKEN, 'primary', {
      summary: 'Deep Work',
      start: { dateTime: '2024-06-24T09:00:00Z', timeZone: 'UTC' },
      end: { dateTime: '2024-06-24T12:00:00Z', timeZone: 'UTC' },
    })
    expect(result.id).toBe('evt-1')
    expect(result.summary).toBe('Deep Work')
  })

  it('throws on non-ok response', async () => {
    server.use(
      http.post(`${GCAL}/primary/events`, () =>
        HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )
    )
    await expect(
      createEvent(TOKEN, 'primary', {
        summary: 'X',
        start: { dateTime: '2024-06-24T09:00:00Z', timeZone: 'UTC' },
        end: { dateTime: '2024-06-24T10:00:00Z', timeZone: 'UTC' },
      })
    ).rejects.toThrow('401')
  })
})

describe('updateEvent', () => {
  beforeEach(() => {
    server.use(
      http.patch(`${GCAL}/primary/events/evt-1`, () =>
        HttpResponse.json({ ...mockEvent, summary: 'Updated' }, { status: 200 })
      )
    )
  })

  it('returns the updated event', async () => {
    const result = await updateEvent(TOKEN, 'primary', 'evt-1', { summary: 'Updated' })
    expect(result.summary).toBe('Updated')
  })
})

describe('deleteEvent', () => {
  beforeEach(() => {
    server.use(
      http.delete(`${GCAL}/primary/events/evt-1`, () => new HttpResponse(null, { status: 204 }))
    )
  })

  it('resolves without error', async () => {
    await expect(deleteEvent(TOKEN, 'primary', 'evt-1')).resolves.toBeUndefined()
  })
})

describe('getEventsForWeek', () => {
  beforeEach(() => {
    server.use(
      http.get(`${GCAL}/primary/events`, () =>
        HttpResponse.json({ items: [mockEvent] }, { status: 200 })
      )
    )
  })

  it('returns array of events', async () => {
    const start = new Date('2024-06-24T00:00:00Z')
    const end = new Date('2024-06-30T23:59:59Z')
    const result = await getEventsForWeek(TOKEN, 'primary', start, end)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('evt-1')
  })

  it('returns empty array when items missing', async () => {
    server.use(
      http.get(`${GCAL}/primary/events`, () =>
        HttpResponse.json({}, { status: 200 })
      )
    )
    const result = await getEventsForWeek(TOKEN, 'primary', new Date(), new Date())
    expect(result).toEqual([])
  })
})
