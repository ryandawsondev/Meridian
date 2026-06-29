import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../utils/render'
import userEvent from '@testing-library/user-event'
import DayView from '../../components/calendar/DayView'
import type { PreviewDay } from '../../hooks/usePlanningPreview'

function makeDays(): PreviewDay[] {
  return [
    {
      dayName: 'monday',
      date: new Date(2024, 5, 24),
      dateISO: '2024-06-24',
      label: 'Monday 24 Jun',
      shortLabel: 'Mon',
      blocks: [
        {
          blockId: 'b-1',
          originalTitle: 'Deep Work',
          displayTitle: 'Deep Work',
          startTime: '09:00',
          endTime: '12:00',
          colour: '#6366f1',
          isVariable: false,
        },
      ],
    },
    {
      dayName: 'tuesday',
      date: new Date(2024, 5, 25),
      dateISO: '2024-06-25',
      label: 'Tuesday 25 Jun',
      shortLabel: 'Tue',
      blocks: [],
    },
    ...(['wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map((dayName, i) => ({
      dayName,
      date: new Date(2024, 5, 26 + i),
      dateISO: `2024-06-${26 + i}`,
      label: `${dayName} ${26 + i} Jun`,
      shortLabel: dayName.slice(0, 3).replace(/^./, (c) => c.toUpperCase()),
      blocks: [],
    })),
  ]
}

describe('DayView', () => {
  it('renders day selector with all 7 days', () => {
    render(<DayView days={makeDays()} onEditBlock={vi.fn()} />)
    expect(screen.getByText('Mon')).toBeInTheDocument()
    expect(screen.getByText('Tue')).toBeInTheDocument()
  })

  it('shows blocks for the selected day', () => {
    render(<DayView days={makeDays()} onEditBlock={vi.fn()} />)
    const matches = screen.getAllByText('Deep Work')
    expect(matches.length).toBeGreaterThan(0)
  })

  it('shows no blocks message for empty day', async () => {
    const user = userEvent.setup()
    render(<DayView days={makeDays()} onEditBlock={vi.fn()} />)

    // Click Tuesday (index 1)
    const dayButtons = screen.getAllByRole('button').filter((b) =>
      b.textContent?.includes('Tue')
    )
    await user.click(dayButtons[0])

    expect(screen.getByText(/no blocks/i)).toBeInTheDocument()
  })

  it('shows hour labels', () => {
    render(<DayView days={makeDays()} onEditBlock={vi.fn()} />)
    expect(screen.getByText('8am')).toBeInTheDocument()
    expect(screen.getByText('12pm')).toBeInTheDocument()
  })
})
