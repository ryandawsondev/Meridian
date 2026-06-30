import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, List, LayoutGrid, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
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

type EditTarget = { blockId: string; originalTitle: string }

const VIEW_OPTIONS = [
  { value: 'day', label: 'Day', Icon: Calendar },
  { value: 'week', label: 'Week', Icon: LayoutGrid },
  { value: 'list', label: 'List', Icon: List },
] as const

export default function PreviewPage() {
  const navigate = useNavigate()
  const { viewMode, setViewMode } = useUiStore()
  const { targetWeekStart, weekPresetId, filledBlocks, clearSession } = usePlanningStore()
  const { session } = useAuth()
  const planDays = usePlanningPreview()
  const weekRange = useWeekRange(targetWeekStart)
  const publishWeek = usePublishWeek()
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null)
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false)

  function handleEditBlock(blockId: string, originalTitle: string) {
    setEditTarget({ blockId, originalTitle })
  }

  async function handlePublishConfirmed() {
    const token = getGoogleAccessToken(session)
    if (!token || !planDays || !targetWeekStart) return
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const result = await publishWeek.mutateAsync({
      days: planDays,
      weekStartISO: targetWeekStart,
      weekPresetId,
      token,
      timeZone,
      userId: session?.user?.id ?? '',
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
  const totalEvents = planDays.reduce((acc, d) => acc + d.blocks.length, 0)

  // Count unfilled variable blocks (moved from StepReview since that step is removed)
  const unfilledCount = planDays.reduce((acc, day) => {
    return acc + day.blocks.filter((b) => {
      if (!b.isVariable) return false
      const key = `${day.dateISO}_${b.blockId}`
      const filled = filledBlocks[key]
      return !filled || !filled.title.trim()
    }).length
  }, 0)

  return (
    <div className="relative">
      {/* Token expiry — sticky top banner (amber = hard blocker) */}
      {!token && session && (
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="flex-1 text-sm text-amber-700 dark:text-amber-300">
            Google session expired — sign out and sign back in to publish.
          </p>
        </div>
      )}

      {/* Loading overlay during publish */}
      <AnimatePresence>
        {publishWeek.isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Publishing to Google Calendar…</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                className={`relative flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors ${
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

        {/* Unfilled blocks info banner (blue = informational, not blocking) */}
        {unfilledCount > 0 && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {unfilledCount} variable block{unfilledCount !== 1 ? 's' : ''} will publish with placeholder text.
            </p>
          </div>
        )}

        {/* View */}
        <div className="mb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {viewMode === 'day' && <DayView days={planDays} onEditBlock={handleEditBlock} />}
              {viewMode === 'week' && <WeekView days={planDays} onEditBlock={handleEditBlock} />}
              {viewMode === 'list' && <ListView days={planDays} onEditBlock={handleEditBlock} />}
            </motion.div>
          </AnimatePresence>
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
          <Button variant="outline" onClick={() => navigate('/planning')}>
            Back
          </Button>
          <Button
            onClick={() => setPublishConfirmOpen(true)}
            disabled={publishWeek.isPending || !token}
          >
            Publish to Calendar
          </Button>
        </div>
      </div>

      {/* Edit dialog */}
      {editTarget && (
        <EditBlockDialog
          blockId={editTarget.blockId}
          originalTitle={editTarget.originalTitle}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* Publish confirm */}
      <AlertDialog open={publishConfirmOpen} onOpenChange={setPublishConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish to Google Calendar?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create {totalEvents} event{totalEvents !== 1 ? 's' : ''} in your Google Calendar for {weekRange.label}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublishConfirmed}>Publish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
                >
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </motion.div>
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
