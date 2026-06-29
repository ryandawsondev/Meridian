import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSession, getGoogleAccessToken } from '../../lib/auth'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

import { supabase } from '../../lib/supabase'

const mockGetSession = vi.mocked(supabase.auth.getSession)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getSession', () => {
  it('returns session when authenticated', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
      provider_token: 'google-token-abc',
    }
    mockGetSession.mockResolvedValueOnce({
      data: { session: mockSession as never },
      error: null,
    })

    const session = await getSession()
    expect(session).toEqual(mockSession)
  })

  it('returns null when not authenticated', async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    })

    const session = await getSession()
    expect(session).toBeNull()
  })

  it('throws on error', async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
      error: { message: 'Network error', name: 'AuthError', status: 500 } as never,
    })

    await expect(getSession()).rejects.toEqual(
      expect.objectContaining({ message: 'Network error' })
    )
  })
})

describe('getGoogleAccessToken', () => {
  it('returns provider_token from session', () => {
    const session = { provider_token: 'google-token-abc' } as never
    expect(getGoogleAccessToken(session)).toBe('google-token-abc')
  })

  it('returns null when no session', () => {
    expect(getGoogleAccessToken(null)).toBeNull()
  })
})
