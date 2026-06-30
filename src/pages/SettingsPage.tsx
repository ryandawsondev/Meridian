import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getGoogleAccessToken, signIn, signOut } from '../lib/auth'
import { useUiStore } from '../stores/uiStore'
import { useUserSettings, useUpdateUserSettings } from '../hooks/useUserSettings'
import { useWeekPresets } from '../hooks/usePresets'
import { useDeleteAllHistory } from '../hooks/usePublishedHistory'
import { useSupabaseHealth, useGoogleCalendarHealth } from '../hooks/useHealthCheck'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type StatusLevel = 'ok' | 'error' | 'loading' | 'disabled'

function StatusDot({ status }: { status: StatusLevel }) {
  const colors: Record<StatusLevel, string> = {
    ok: 'bg-green-500',
    error: 'bg-red-500',
    loading: 'bg-amber-500',
    disabled: 'bg-muted-foreground/40',
  }
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      {status === 'ok' && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
      )}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${colors[status]}`} />
    </span>
  )
}

interface HealthRowProps {
  label: string
  sublabel: string
  isFetching: boolean
  isError: boolean
  data: { latencyMs: number } | undefined
  dataUpdatedAt: number
  disabled?: boolean
  onPing: () => void
}

function HealthRow({
  label,
  sublabel,
  isFetching,
  isError,
  data,
  dataUpdatedAt,
  disabled,
  onPing,
}: HealthRowProps) {
  const level: StatusLevel = disabled
    ? 'disabled'
    : isFetching && !data
      ? 'loading'
      : isError
        ? 'error'
        : data
          ? 'ok'
          : 'loading'
  const checkedAt = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <StatusDot status={level} />
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{sublabel}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="text-right">
          {data != null && <p className="text-xs font-medium tabular-nums">{data.latencyMs} ms</p>}
          {checkedAt && !disabled && (
            <p className="text-xs tabular-nums text-muted-foreground">{checkedAt}</p>
          )}
          {disabled && <p className="text-xs text-muted-foreground">Not signed in</p>}
        </div>
        <button
          onClick={onPing}
          disabled={disabled || isFetching}
          className="shrink-0 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isFetching ? '…' : 'Ping'}
        </button>
      </div>
    </div>
  )
}

const ROW = 'flex items-center justify-between gap-3 px-4 py-3'
const LABEL = 'text-sm font-medium'
const SUBLABEL = 'text-xs text-muted-foreground'
const BTN_NEUTRAL =
  'shrink-0 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium transition-colors hover:bg-muted'
const BTN_DESTRUCTIVE =
  'shrink-0 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10'
const CARD = 'divide-y divide-border rounded-xl border border-input bg-card'
const SECTION_LABEL = 'mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground'
const SEGMENTED = 'flex rounded-lg border border-input bg-muted p-0.5'
const SEG_BTN = (active: boolean) =>
  `rounded px-3 py-1 text-xs font-medium capitalize transition-colors ${
    active
      ? 'bg-background text-foreground shadow-sm'
      : 'text-muted-foreground hover:text-foreground'
  }`

export default function SettingsPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const token = getGoogleAccessToken(session)
  const { theme, setTheme, viewMode, setViewMode } = useUiStore()
  const { data: userSettings } = useUserSettings()
  const updateSettings = useUpdateUserSettings()
  const { data: weekPresets } = useWeekPresets()
  const deleteAllHistory = useDeleteAllHistory()
  const [deleteHistoryOpen, setDeleteHistoryOpen] = useState(false)

  const supabaseHealth = useSupabaseHealth(!!session)
  const gcalHealth = useGoogleCalendarHealth(token)

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
          <p className={SECTION_LABEL}>Google Calendar</p>
          <div className={CARD}>
            {isConnected && (
              <div className={ROW}>
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
                  <div className="min-w-0">
                    <p className={LABEL}>Connected</p>
                    <p className={`truncate ${SUBLABEL}`}>{session.user.email}</p>
                  </div>
                </div>
                <button onClick={handleSignOut} className={BTN_NEUTRAL}>
                  Disconnect
                </button>
              </div>
            )}

            {isExpired && (
              <div className={ROW}>
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  <div className="min-w-0">
                    <p className={LABEL}>Session expired</p>
                    <p className={SUBLABEL}>Re-authenticate to publish or view calendar events.</p>
                  </div>
                </div>
                <button onClick={() => void signIn()} className={BTN_NEUTRAL}>
                  Reconnect
                </button>
              </div>
            )}

            {!session && (
              <div className={ROW}>
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                  <div className="min-w-0">
                    <p className={LABEL}>Not connected</p>
                    <p className={SUBLABEL}>Connect to publish and view calendar events.</p>
                  </div>
                </div>
                <button onClick={() => void signIn()} className={BTN_NEUTRAL}>
                  Connect
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Appearance */}
        <section>
          <p className={SECTION_LABEL}>Appearance</p>
          <div className={CARD}>
            <div className={ROW}>
              <p className={LABEL}>Theme</p>
              <div className={SEGMENTED}>
                {(['light', 'dark'] as const).map((t) => (
                  <button key={t} onClick={() => handleTheme(t)} className={SEG_BTN(theme === t)}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className={ROW}>
              <p className={LABEL}>Default view</p>
              <div className={SEGMENTED}>
                {(['day', 'week', 'list'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setViewMode(v)}
                    className={SEG_BTN(viewMode === v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Planning */}
        <section>
          <p className={SECTION_LABEL}>Planning</p>
          <div className={CARD}>
            <div className={ROW}>
              <div className="min-w-0">
                <p className={LABEL}>Default week preset</p>
                <p className={SUBLABEL}>Pre-selected when starting a new week</p>
              </div>
              <Select
                value={userSettings?.defaultWeekPresetId ?? '__none__'}
                onValueChange={(v) =>
                  updateSettings.mutate({ defaultWeekPresetId: v === '__none__' ? null : v })
                }
              >
                <SelectTrigger className="w-44 shrink-0 text-xs">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {weekPresets?.map((wp) => (
                    <SelectItem key={wp.id} value={wp.id}>
                      {wp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Data */}
        <section>
          <p className={SECTION_LABEL}>Data</p>
          <div className={CARD}>
            <div className={ROW}>
              <div className="min-w-0">
                <p className={LABEL}>Delete history</p>
                <p className={SUBLABEL}>
                  Removes all published week records. Google Calendar events are not affected.
                </p>
              </div>
              <button onClick={() => setDeleteHistoryOpen(true)} className={BTN_DESTRUCTIVE}>
                Delete
              </button>
            </div>
          </div>
        </section>

        {/* Status */}
        <section>
          <p className={SECTION_LABEL}>Status</p>
          <div className={CARD}>
            <HealthRow
              label="Supabase"
              sublabel="Database & presets"
              isFetching={supabaseHealth.isFetching}
              isError={supabaseHealth.isError}
              data={supabaseHealth.data}
              dataUpdatedAt={supabaseHealth.dataUpdatedAt}
              disabled={!session}
              onPing={() => void supabaseHealth.refetch()}
            />
            <HealthRow
              label="Google Calendar"
              sublabel="Calendar API"
              isFetching={gcalHealth.isFetching}
              isError={gcalHealth.isError}
              data={gcalHealth.data}
              dataUpdatedAt={gcalHealth.dataUpdatedAt}
              disabled={!token}
              onPing={() => void gcalHealth.refetch()}
            />
          </div>
        </section>

        {/* Account */}
        <section>
          <p className={SECTION_LABEL}>Account</p>
          <div className={CARD}>
            <div className={ROW}>
              <div className="min-w-0">
                <p className={LABEL}>Signed in as</p>
                <p className={`truncate ${SUBLABEL}`}>{session?.user.email}</p>
              </div>
              <button onClick={handleSignOut} className={BTN_DESTRUCTIVE}>
                Sign out
              </button>
            </div>
          </div>
        </section>
      </div>

      <AlertDialog open={deleteHistoryOpen} onOpenChange={setDeleteHistoryOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all history?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes all published week records from Meridian. Your Google Calendar events are
              not deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteAllHistory.mutate()}
              disabled={deleteAllHistory.isPending}
            >
              {deleteAllHistory.isPending ? 'Deleting…' : 'Delete history'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
