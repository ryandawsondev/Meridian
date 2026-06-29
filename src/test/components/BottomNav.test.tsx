import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BottomNav from '../../components/layout/BottomNav'

function renderNav(initialPath = '/planning') {
  return render(
    React.createElement(
      MemoryRouter,
      { initialEntries: [initialPath] },
      React.createElement(BottomNav)
    )
  )
}

describe('BottomNav', () => {
  it('renders all three nav labels', () => {
    renderNav()
    expect(screen.getByText('Plan')).toBeInTheDocument()
    expect(screen.getByText('Presets')).toBeInTheDocument()
    expect(screen.getByText('History')).toBeInTheDocument()
  })

  it('has main navigation landmark', () => {
    renderNav()
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument()
  })

  it('marks the active link with aria-current', () => {
    renderNav('/presets')
    const presetsLink = screen.getByRole('link', { name: /presets/i })
    expect(presetsLink).toHaveAttribute('aria-current', 'page')
  })

  it('does not mark inactive links with aria-current', () => {
    renderNav('/presets')
    const planLink = screen.getByRole('link', { name: /plan/i })
    expect(planLink).not.toHaveAttribute('aria-current', 'page')
  })

  it('renders three links', () => {
    renderNav()
    expect(screen.getAllByRole('link')).toHaveLength(3)
  })
})
