import { useNavigate } from 'react-router-dom'
import { usePlanningStore } from '../../stores/planningStore'
import { useWeekPresets, useDayPresets } from '../../hooks/usePresets'
import { useWeekRange } from '../../hooks/useWeekRange'
import { getDayName, formatDayLabel } from '../../lib/date'
import type { Block } from '../../types'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

export default function StepReview() {
  const navigate = useNavigate()
  const { weekPresetId, targetWeekStart, filledBlocks, setStep } = usePlanningStore()
  const { data: weekPresets = [] } = useWeekPresets()
  const { data: dayPresets = [] } = useDayPresets()
  const weekRange = useWeekRange(targetWeekStart)

  const weekPreset = weekPresets.find((p) => p.id === weekPresetId)

  const days = (weekRange?.dates ?? []).map((date) => {
    const dayName = getDayName(date)
    const dayPresetId = weekPreset?.days[dayName]
    const dayPreset = dayPresets.find((dp) => dp.id === dayPresetId)
    return { label: formatDayLabel(date), blocks: dayPreset?.blocks ?? [] }
  })

  const hasAnyBlocks = days.some((d) => d.blocks.length > 0)

  function getDisplayTitle(block: Block): string {
    if (!block.isVariable) return block.title
    const filled = filledBlocks[block.id]
    return filled?.title || `(${block.title})`
  }

  function getSubTaskCount(block: Block): number {
    if (!block.isVariable) return 0
    return filledBlocks[block.id]?.subTasks?.length ?? 0
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <p className="text-sm font-semibold">
          {weekRange ? weekRange.label : 'Week not selected'}
        </p>
        {weekPreset && (
          <p className="text-xs text-muted-foreground">{weekPreset.name}</p>
        )}
      </div>

      {/* Empty state */}
      {!hasAnyBlocks && (
        <div className="rounded-xl border border-dashed border-input px-6 py-10 text-center">
          <p className="text-sm font-medium">Empty week</p>
          <p className="mt-1 text-xs text-muted-foreground">
            No blocks — you can add events directly in Google Calendar after publishing.
          </p>
        </div>
      )}

      {/* Day list */}
      {days.map(({ label, blocks }) => {
        if (blocks.length === 0) return null
        return (
          <div key={label}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <div className="flex flex-col gap-1.5">
              {blocks.map((block) => {
                const subCount = getSubTaskCount(block)
                return (
                  <div
                    key={block.id}
                    className="flex items-center gap-3 rounded-lg border border-input bg-card px-3 py-2.5"
                  >
                    <div
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: block.colour }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`truncate text-sm font-medium ${block.isVariable && !filledBlocks[block.id]?.title ? 'text-muted-foreground' : ''}`}>
                        {getDisplayTitle(block)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {block.startTime}–{block.endTime}
                        {subCount > 0 && ` · ${subCount} sub-task${subCount !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                    {block.isVariable && (
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        variable
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(3)}>
          Back
        </Button>
        <Button onClick={() => navigate('/preview')}>Go to preview</Button>
      </div>
    </div>
  )
}
