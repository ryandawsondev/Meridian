import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '../utils/render'
import userEvent from '@testing-library/user-event'
import BlockForm from '../../components/presets/BlockForm'

describe('BlockForm', () => {
  it('renders all fields', () => {
    render(<BlockForm onSubmit={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/start time/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/end time/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/colour/i)).toBeInTheDocument()
    expect(screen.getByText(/variable block/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
  })

  it('shows validation error when title is empty', async () => {
    const user = userEvent.setup()
    render(<BlockForm onSubmit={vi.fn()} onCancel={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /save block/i }))
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument()
    })
  })

  it('shows end time error when end is before start', async () => {
    const user = userEvent.setup()
    render(
      <BlockForm
        defaultValues={{ startTime: '10:00', endTime: '09:00' }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    await user.clear(screen.getByLabelText(/title/i))
    await user.type(screen.getByLabelText(/title/i), 'Morning')
    await user.click(screen.getByRole('button', { name: /save block/i }))

    await waitFor(() => {
      expect(screen.getByText(/end time must be after start time/i)).toBeInTheDocument()
    })
  })

  it('calls onSubmit with correct values when form is valid', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<BlockForm onSubmit={onSubmit} onCancel={vi.fn()} />)

    await user.type(screen.getByLabelText(/title/i), 'Morning Routine')
    await user.click(screen.getByRole('button', { name: /save block/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Morning Routine',
          startTime: '09:00',
          endTime: '10:00',
          isVariable: false,
        }),
        expect.anything()
      )
    })
  })

  it('calls onCancel when cancel button clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<BlockForm onSubmit={vi.fn()} onCancel={onCancel} />)

    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('shows overlap error when provided', () => {
    render(
      <BlockForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        overlapError='"Morning" overlaps with "Lunch"'
      />
    )
    expect(screen.getByText(/"Morning" overlaps with "Lunch"/)).toBeInTheDocument()
  })

  it('populates default values', () => {
    render(
      <BlockForm
        defaultValues={{ title: 'Deep Work', startTime: '08:00', endTime: '12:00' }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.getByLabelText<HTMLInputElement>(/title/i).value).toBe('Deep Work')
  })
})
