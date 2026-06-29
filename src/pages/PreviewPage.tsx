import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, List, LayoutGrid } from 'lucide-react'
import { usePlanningPreview } from '../hooks/usePlanningPreview'
import { useUiStore } from '../stores/uiStore'
import { usePlanningStore } from '../stores/planningStore'
import { useWeekRange } from '../hooks/useWeekRange'
import DayView from '../components/calendar/DayView'
import WeekView from '../components/calendar/WeekView'
import ListView from '../components/calendar/ListView'
import EditBlockDialog from '../components/calendar/EditBlockDialog'
import { Button } from '../components/ui/button'

type EditTarget = { blockId: string; originalTitle: string }

const VIEW_OPTIONS = [
  { value: 'day', label: 'Day', Icon: Calendar },
  { value: 'week', label: 'Week', Icon: LayoutGrid },
  { value: 'list', label: 'List', Icon: List },
] as const

export default function PreviewPage() {
  const navigate = useNavigate()
  const { viewMode, setViewMode } = useUiStore()
  const { targetWeekStart, setStep } = usePlanningStore()
  const planDays = usePlanningPreview()
  const weekRange = useWeekRange(targetWeekStart)
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)

  function handleEditBlock(blockId: string, originalTitle: string) {
    setEditTarget({ blockId, originalTitle })
  }

  if (!planDays || !weekRange) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-4 py-16">
        <p className="text-muted-foreground">No planning session active.</p>
        <Button onClick={() => navigate('/planning')}>Go to planning</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Week preview</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">{weekRange.label}</p>
        </div>
        {/* View toggle */}
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
        {viewMode === 'day' && (
          <DayView days={planDays} onEditBlock={handleEditBlock} />
        )}
        {viewMode === 'week' && (
          <WeekView days={planDays} onEditBlock={handleEditBlock} />
        )}
        {viewMode === 'list' && (
          <ListView days={planDays} onEditBlock={handleEditBlock} />
        )}
      </div>

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
          onClick={() => {
            // Milestone 7: Google Calendar publish
          }}
        >
          Publish to Calendar
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
    </div>
  )
}
