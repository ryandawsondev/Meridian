import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, List, LayoutGrid, CheckCircle2, AlertCircle } from 'lucide-react'
import { usePlanningPreview } from '../hooks/usePlanningPreview'
import { useUiStore } from '../stores/uiStore'
import { usePlanningStore } from '../stores/planningStore'
import { useWeekRange } from '../hooks/useWeekRange'
import { useAuth } from '../hooks/useAuth'
import { getGoogleAccessToken } from '../lib/auth'
import { usePublishWeek, type PublishResult } from '../hooks/useGoogleCalendar'
import DayView from '../components/calendar/DayView'
import WeekView from '../components/calendar/WeekView'
import ListView from '../components/calendar/ListView'
import EditBlockDialog from '../components/calendar/EditBlockDialog'
import { Button } from '../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog'

type EditTarget = { blockId: string; originalTitle: string }

const VIEW_OPTIONS = [
  { value: 'day', label: 'Day', Icon: Calendar },
  { value: 'week', label: 'Week', Icon: LayoutGrid },
  { value: 'list', label: 'List', Icon: List },
] as const

export default function PreviewPage() {
  const navigate = useNavigate()
  const { viewMode, setViewMode } = useUiStore()
  const { targetWeekStart, weekPresetId, setStep, clearSession } = usePlanningStore()
  const { session } = useAuth()
  const planDays = usePlanningPreview()
  const weekRange = useWeekRange(targetWeekStart)
  const publishWeek = usePublishWeek()
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null)

  function handleEditBlock(blockId: string, originalTitle: string) {
    setEditTarget({ blockId, originalTitle })
  }

  async function handlePublish() {
    const token = getGoogleAccessToken(session)
    if (!token || !planDays || !targetWeekStart) return
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const result = await publishWeek.mutateAsync({
      days: planDays,
      weekStartISO: targetWeekStart,
      weekPresetId,
      token,
      timeZone,
    })
    setPublishResult(result)
  }

  function handleDone() {
    clearSession()
    navigate('/planning')
  }

  if (!planDays || !weekRange) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-4 py-16">
        <p className="text-muted-foreground">No planning session active.</p>
        <Button onClick={() => navigate('/planning')}>Go to planning</Button>
      </div>
    )
  }

  const token = getGoogleAccessToken(session)

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Week preview</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">{weekRange.label}</p>
        </div>
        <div className="flex rounded-lg border border-input bg-muted p-0.5">
          {VIEW_OPTIONS.map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => setViewMode(value)}
              aria-label={label}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors ${
                viewMode === value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* View */}
      <div className="mb-6">
        {viewMode === 'day' && <DayView days={planDays} onEditBlock={handleEditBlock} />}
        {viewMode === 'week' && <WeekView days={planDays} onEditBlock={handleEditBlock} />}
        {viewMode === 'list' && <ListView days={planDays} onEditBlock={handleEditBlock} />}
      </div>

      {/* Publish error */}
      {publishWeek.isError && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">
            Publish failed: {String(publishWeek.error)}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            setStep(4)
            navigate('/planning')
          }}
        >
          Back
        </Button>
        <Button
          onClick={handlePublish}
          disabled={publishWeek.isPending || !token}
        >
          {publishWeek.isPending ? 'Publishing…' : 'Publish to Calendar'}
        </Button>
      </div>

      {/* Edit dialog */}
      {editTarget && (
        <EditBlockDialog
          blockId={editTarget.blockId}
          originalTitle={editTarget.originalTitle}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* Publish result dialog */}
      {publishResult && (
        <Dialog open onOpenChange={() => {}}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>
                {publishResult.failures.length === 0 ? 'Published!' : 'Partially published'}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-sm">
                  {publishResult.successCount} event
                  {publishResult.successCount !== 1 ? 's' : ''} added to Google Calendar
                </p>
              </div>
              {publishResult.failures.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-medium text-destructive">
                    {publishResult.failures.length} event
                    {publishResult.failures.length !== 1 ? 's' : ''} failed:
                  </p>
                  {publishResult.failures.map((f, i) => (
                    <div key={i} className="rounded border border-destructive/20 bg-destructive/5 px-3 py-2">
                      <p className="text-xs font-medium">{f.title}</p>
                      <p className="text-[10px] text-muted-foreground">{f.dayDate}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleDone}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
