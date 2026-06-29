import { http, HttpResponse } from 'msw'

// Supabase URL used in tests — set via vitest env config
const BASE = 'https://test.supabase.co/rest/v1'
const AUTH = 'https://test.supabase.co/auth/v1'

// ─── Fixture data ─────────────────────────────────────────────────────────────

export const fixtures = {
  block: {
    id: 'block-1',
    day_preset_id: 'preset-1',
    title: 'Morning Routine',
    start_time: '07:00',
    end_time: '08:00',
    colour: '#4f46e5',
    is_variable: false,
    notes: null,
    order: 0,
  },
  dayPreset: {
    id: 'preset-1',
    user_id: 'user-123',
    name: 'Work Day',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  weekPreset: {
    id: 'week-1',
    user_id: 'user-123',
    name: 'Standard Week',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  weekPresetDay: {
    id: 'wpd-1',
    week_preset_id: 'week-1',
    day_of_week: 'monday',
    day_preset_id: 'preset-1',
  },
  userSettings: {
    user_id: 'user-123',
    default_week_preset_id: 'week-1',
    preferred_view: 'week',
  },
}

// ─── Auth handlers ────────────────────────────────────────────────────────────

export const authHandlers = [
  http.get(`${AUTH}/user`, () =>
    HttpResponse.json({
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
    })
  ),
  http.post(`${AUTH}/logout`, () => new HttpResponse(null, { status: 204 })),
]

// ─── Supabase REST handlers ───────────────────────────────────────────────────

export const supabaseHandlers = [
  // day_presets
  http.get(`${BASE}/day_presets`, () =>
    HttpResponse.json([{ ...fixtures.dayPreset, blocks: [fixtures.block] }])
  ),
  http.post(`${BASE}/day_presets`, () =>
    HttpResponse.json({ ...fixtures.dayPreset }, { status: 201 })
  ),
  http.patch(`${BASE}/day_presets`, () => new HttpResponse(null, { status: 204 })),
  http.delete(`${BASE}/day_presets`, () => new HttpResponse(null, { status: 204 })),

  // blocks
  http.get(`${BASE}/blocks`, () => HttpResponse.json([fixtures.block])),
  http.post(`${BASE}/blocks`, () =>
    HttpResponse.json({ ...fixtures.block }, { status: 201 })
  ),
  http.patch(`${BASE}/blocks`, () => new HttpResponse(null, { status: 204 })),
  http.delete(`${BASE}/blocks`, () => new HttpResponse(null, { status: 204 })),

  // week_presets
  http.get(`${BASE}/week_presets`, () =>
    HttpResponse.json([{ ...fixtures.weekPreset, week_preset_days: [fixtures.weekPresetDay] }])
  ),
  http.post(`${BASE}/week_presets`, () =>
    HttpResponse.json({ ...fixtures.weekPreset }, { status: 201 })
  ),
  http.patch(`${BASE}/week_presets`, () => new HttpResponse(null, { status: 204 })),
  http.delete(`${BASE}/week_presets`, () => new HttpResponse(null, { status: 204 })),

  // week_preset_days
  http.post(`${BASE}/week_preset_days`, () => new HttpResponse(null, { status: 201 })),
  http.delete(`${BASE}/week_preset_days`, () => new HttpResponse(null, { status: 204 })),

  // user_settings
  http.get(`${BASE}/user_settings`, () => HttpResponse.json(fixtures.userSettings)),
  http.post(`${BASE}/user_settings`, () => new HttpResponse(null, { status: 201 })),
]

export const handlers = [...authHandlers, ...supabaseHandlers]
