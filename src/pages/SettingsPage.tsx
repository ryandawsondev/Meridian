import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getGoogleAccessToken, signIn, signOut } from '../lib/auth'
import { useUiStore } from '../stores/uiStore'
import { useUserSettings, useUpdateUserSettings } from '../hooks/useUserSettings'
import { useWeekPresets } from '../hooks/usePresets'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const token = getGoogleAccessToken(session)
  const { theme, setTheme, viewMode, setViewMode } = useUiStore()
  const { data: userSettings } = useUserSettings()
  const updateSettings = useUpdateUserSettings()
  const { data: weekPresets } = useWeekPresets()

  const isConnected = !!session && !!token
  const isExpired = !!session && !token

  function handleTheme(next: 'light' | 'dark') {
    setTheme(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-xl font-semibold tracking-tight">Settings</h1>

      <div className="flex flex-col gap-6">
        {/* Google Calendar */}
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Google Calendar
          </p>
          <div className="rounded-xl border border-input bg-card px-4 py-3">
            {isConnected && (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
                  <div>
                    <p className="text-sm font-medium">Connected</p>
                    <p className="text-xs text-muted-foreground">{session.user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="shrink-0 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
                >
                  Disconnect
                </button>
              </div>
            )}

            {isExpired && (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  <div>
                    <p className="text-sm font-medium">Session expired</p>
                    <p className="text-xs text-muted-foreground">
                      Re-authenticate to publish or view calendar events.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => void signIn()}
                  className="shrink-0 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
                >
                  Reconnect
                </button>
              </div>
            )}

            {!session && (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                  <p className="text-sm font-medium">Not connected</p>
                </div>
                <button
                  onClick={() => void signIn()}
                  className="shrink-0 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
                >
                  Connect
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Appearance */}
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Appearance
          </p>
          <div className="divide-y divide-border rounded-xl border border-input bg-card">
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-sm font-medium">Theme</p>
              <div className="flex rounded-lg border border-input bg-muted p-0.5">
                {(['light', 'dark'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleTheme(t)}
                    className={`rounded px-3 py-1 text-xs font-medium capitalize transition-colors ${
                      theme === t
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-sm font-medium">Default view</p>
              <div className="flex rounded-lg border border-input bg-muted p-0.5">
                {(['day', 'week', 'list'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setViewMode(v)}
                    className={`rounded px-3 py-1 text-xs font-medium capitalize transition-colors ${
                      viewMode === v
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Planning defaults */}
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Planning
          </p>
          <div className="rounded-xl border border-input bg-card px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">Default week preset</p>
                <p className="text-xs text-muted-foreground">Pre-selected when starting a new week</p>
              </div>
              <select
                value={userSettings?.defaultWeekPresetId ?? ''}
                onChange={(e) =>
                  updateSettings.mutate({ defaultWeekPresetId: e.target.value || null })
                }
                className="shrink-0 rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">None</option>
                {weekPresets?.map((wp) => (
                  <option key={wp.id} value={wp.id}>
                    {wp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Account */}
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Account
          </p>
          <div className="rounded-xl border border-input bg-card px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm text-muted-foreground">{session?.user.email}</p>
              <button
                onClick={handleSignOut}
                className="shrink-0 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                Sign out
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
