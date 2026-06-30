# Settings Page

Route: `/settings`
Nav: add Settings icon to BottomNav (or place in header as gear icon — see §Nav below)

---

## Sections

### 1. Google Calendar

The app's Google auth and calendar access are coupled through a single OAuth session. There is no way to revoke calendar scope independently without signing out. The connection UI should reflect this honestly.

**Connection states:**

| State | Indicator | Available actions |
|-------|-----------|-------------------|
| Connected | Green dot + user email | Disconnect (= sign out) |
| Token expired | Amber dot + "Session expired" | Reconnect |
| Not connected | Red dot + "Not connected" | Connect |

**Reconnect** → calls `signIn()` from `src/lib/auth.ts`. Triggers Google OAuth re-consent with the same `calendar.events` scope. Redirects away and back.

**Disconnect** → calls `signOut()`. Clears the session entirely. Redirects to `/sign-in`. Because Google OAuth is the only sign-in method, disconnecting = signing out.

**Note on token expiry**: `provider_token` (Google access token) expires after ~1 hour. Supabase refreshes its own JWT but does NOT refresh `provider_token`. If the user's session shows as valid but calendar writes/reads fail, it's this. The Reconnect action resolves it.

**UI layout:**
```
┌─────────────────────────────────────────────────────┐
│  Google Calendar                                    │
│  ─────────────────────────────────────────────────  │
│  ● Connected                        [Disconnect]   │
│  ryan@gmail.com                                     │
└─────────────────────────────────────────────────────┘

// or when expired:

┌─────────────────────────────────────────────────────┐
│  Google Calendar                                    │
│  ─────────────────────────────────────────────────  │
│  ◐ Session expired                  [Reconnect]    │
│  Re-authenticate to publish or view calendar events │
└─────────────────────────────────────────────────────┘
```

---

### 2. Appearance

Controls already live in `uiStore` (persisted to localStorage). Settings page surfaces them in one place.

- **Theme** — Light / Dark (currently a toggle in AppShell header; can duplicate or move here)
- **Default view** — Day / Week / List (used in PreviewPage and History; persisted via `viewMode` in uiStore)

---

### 3. Planning defaults

These write to the `user_settings` Supabase table (`default_week_preset_id`, `preferred_view`).

- **Default week preset** — dropdown of available week presets. Pre-selects the chosen preset in the planning flow's StepPresetPicker. `null` = no default (user always picks manually).

---

### 4. Account

- User email (read-only, from `session.user.email`)
- **Sign out** button (destructive style, calls `signOut()`)

---

## Navigation placement

**Option A — BottomNav 4th item** (Settings icon)
- Requires shifting the 3-item nav to 4 items
- Plan icon loses its "primary" sizing advantage since all 4 share equal space
- Cleanest mobile pattern

**Option B — Gear icon in AppShell header**
- Header already has ThemeToggle + sign-out
- Keeps BottomNav focused on core flow (Plan / Presets / History)
- Settings accessed less frequently — header is appropriate
- Recommended for now; move to BottomNav only if settings usage grows

---

## Implementation notes

- New page: `src/pages/SettingsPage.tsx`
- Add route `/settings` in `src/App.tsx` (protected)
- `useAuth()` provides `session` (email, `provider_token` presence = connected)
- `getGoogleAccessToken(session)` → non-null = connected, null = expired or not connected
- Re-use `signIn` / `signOut` from `src/lib/auth.ts` directly in the page (no new hook needed)
- `user_settings` read/write via a `useUserSettings` hook (TanStack Query) if default preset picker is implemented
- No new packages required
