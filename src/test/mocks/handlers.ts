import { http, HttpResponse } from 'msw'

const SUPABASE_URL = 'http://localhost:54321'

export const authHandlers = [
  http.get(`${SUPABASE_URL}/auth/v1/user`, () => {
    return HttpResponse.json({
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
    })
  }),

  http.post(`${SUPABASE_URL}/auth/v1/logout`, () => {
    return new HttpResponse(null, { status: 204 })
  }),
]

export const handlers = [...authHandlers]
