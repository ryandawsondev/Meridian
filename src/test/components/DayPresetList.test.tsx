import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../utils/render'
import userEvent from '@testing-library/user-event'
import DayPresetList from '../../components/presets/DayPresetList'
import type { DayPreset } from '../../types'

// ─── Mock hooks ───────────────────────────────────────────────────────────────

const mockUseDayPresets = vi.fn()
const mockUseCreateDayPreset = vi.fn()
const mockUseDeleteDayPreset = vi.fn()

vi.mock('../../hooks/usePresets', () => ({
  useDayPresets: () => mockUseDayPresets(),
  useCreateDayPreset: () => mockUseCreateDayPreset(),
  useDeleteDayPreset: () => mockUseDeleteDayPreset(),
  useUpdateDayPreset: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useWeekPresets: vi.fn(() => ({ data: [], isLoading: false, error: null })),
}))

vi.mock('../../hooks/useBlocks', () => ({
  useCreateBlock: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateBlock: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useDeleteBlock: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useReorderBlocks: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockPreset: DayPreset = {
  id: 'preset-1',
  name: 'Work Day',
  blocks: [
    {
      id: 'block-1',
      title: 'Deep Work',
      startTime: '09:00',
      endTime: '12:00',
      colour: '#6366f1',
      isVariable: false,
    },
  ],
}

const defaultMutation = { mutateAsync: vi.fn(), isPending: false }

beforeEach(() => {
  vi.clearAllMocks()
  mockUseCreateDayPreset.mockReturnValue(defaultMutation)
  mockUseDeleteDayPreset.mockReturnValue(defaultMutation)
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DayPresetList', () => {
  it('shows empty state when no presets', () => {
    mockUseDayPresets.mockReturnValue({ data: [], isLoading: false, error: null })
    render(<DayPresetList />)
    expect(screen.getByText('No day presets')).toBeInTheDocument()
  })

  it('renders preset list', () => {
    mockUseDayPresets.mockReturnValue({ data: [mockPreset], isLoading: false, error: null })
    render(<DayPresetList />)
    expect(screen.getByText('Work Day')).toBeInTheDocument()
    expect(screen.getByText(/1 block/)).toBeInTheDocument()
  })

  it('shows loading state', () => {
    mockUseDayPresets.mockReturnValue({ data: [], isLoading: true, error: null })
    render(<DayPresetList />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows error state', () => {
    mockUseDayPresets.mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('Failed'),
    })
    render(<DayPresetList />)
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
  })

  it('opens create dialog on button click', async () => {
    const user = userEvent.setup()
    mockUseDayPresets.mockReturnValue({ data: [], isLoading: false, error: null })
    render(<DayPresetList />)

    await user.click(screen.getByRole('button', { name: /new day preset/i }))
    expect(screen.getByPlaceholderText(/e\.g\. Work Day/i)).toBeInTheDocument()
  })

  it('calls createPreset with trimmed name', async () => {
    const user = userEvent.setup()
    const mutateAsync = vi.fn().mockResolvedValue(mockPreset)
    mockUseDayPresets.mockReturnValue({ data: [], isLoading: false, error: null })
    mockUseCreateDayPreset.mockReturnValue({ mutateAsync, isPending: false })

    render(<DayPresetList />)
    await user.click(screen.getByRole('button', { name: /new day preset/i }))
    await user.type(screen.getByPlaceholderText(/e\.g\. Work Day/i), '  Focus Day  ')
    await user.click(screen.getByRole('button', { name: /^create$/i }))

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith('Focus Day'))
  })

  it('shows delete confirm dialog', async () => {
    const user = userEvent.setup()
    mockUseDayPresets.mockReturnValue({ data: [mockPreset], isLoading: false, error: null })
    render(<DayPresetList />)

    await user.click(screen.getByRole('button', { name: /delete preset/i }))
    expect(screen.getByText(/delete day preset/i)).toBeInTheDocument()
  })
})
