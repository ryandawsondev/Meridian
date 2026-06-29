import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../utils/render'
import userEvent from '@testing-library/user-event'
import ListView from '../../components/calendar/ListView'
import type { PreviewDay } from '../../hooks/usePlanningPreview'

const mockDays: PreviewDay[] = [
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
      {
        blockId: 'b-2',
        originalTitle: 'Variable Block',
        displayTitle: 'Ukrainian study',
        notes: 'Vocab chapter 3',
        startTime: '13:00',
        endTime: '15:00',
        colour: '#f59e0b',
        isVariable: true,
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
]

describe('ListView', () => {
  it('renders days with blocks', () => {
    render(<ListView days={mockDays} onEditBlock={vi.fn()} />)
    expect(screen.getByText('Monday 24 Jun')).toBeInTheDocument()
    expect(screen.getByText('Deep Work')).toBeInTheDocument()
    expect(screen.getByText('Ukrainian study')).toBeInTheDocument()
  })

  it('hides days with no blocks', () => {
    render(<ListView days={mockDays} onEditBlock={vi.fn()} />)
    expect(screen.queryByText('Tuesday 25 Jun')).not.toBeInTheDocument()
  })

  it('shows empty state when all days are empty', () => {
    const emptyDays: PreviewDay[] = mockDays.map((d) => ({ ...d, blocks: [] }))
    render(<ListView days={emptyDays} onEditBlock={vi.fn()} />)
    expect(screen.getByText(/no blocks this week/i)).toBeInTheDocument()
  })

  it('renders edit button for variable blocks', () => {
    render(<ListView days={mockDays} onEditBlock={vi.fn()} />)
    expect(screen.getByRole('button', { name: /edit block/i })).toBeInTheDocument()
  })

  it('does not render edit button for fixed blocks', () => {
    const onEditBlock = vi.fn()
    render(<ListView days={mockDays} onEditBlock={onEditBlock} />)
    const editButtons = screen.queryAllByRole('button', { name: /edit block/i })
    expect(editButtons).toHaveLength(1) // only the variable block
  })

  it('calls onEditBlock with correct args when edit clicked', async () => {
    const user = userEvent.setup()
    const onEditBlock = vi.fn()
    render(<ListView days={mockDays} onEditBlock={onEditBlock} />)

    await user.click(screen.getByRole('button', { name: /edit block/i }))
    expect(onEditBlock).toHaveBeenCalledWith('b-2', 'Variable Block')
  })
})
