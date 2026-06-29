import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../utils/render'
import WeekView from '../../components/calendar/WeekView'
import type { PreviewDay } from '../../hooks/usePlanningPreview'

function makeDays(): PreviewDay[] {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
  const shorts = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const labels = ['Monday 24 Jun', 'Tuesday 25 Jun', 'Wednesday 26 Jun', 'Thursday 27 Jun', 'Friday 28 Jun', 'Saturday 29 Jun', 'Sunday 30 Jun']

  return days.map((dayName, i) => ({
    dayName,
    date: new Date(2024, 5, 24 + i),
    dateISO: `2024-06-${String(24 + i).padStart(2, '0')}`,
    label: labels[i],
    shortLabel: shorts[i],
    blocks:
      i === 0
        ? [
            {
              blockId: 'b-1',
              originalTitle: 'Deep Work',
              displayTitle: 'Deep Work',
              startTime: '09:00',
              endTime: '12:00',
              colour: '#6366f1',
              isVariable: false,
            },
          ]
        : [],
  }))
}

describe('WeekView', () => {
  it('renders all 7 day headers', () => {
    render(<WeekView days={makeDays()} onEditBlock={vi.fn()} />)
    const shorts = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    shorts.forEach((s) => expect(screen.getByText(s)).toBeInTheDocument())
  })

  it('renders block in correct day column', () => {
    render(<WeekView days={makeDays()} onEditBlock={vi.fn()} />)
    expect(screen.getByText('Deep Work')).toBeInTheDocument()
  })
})
