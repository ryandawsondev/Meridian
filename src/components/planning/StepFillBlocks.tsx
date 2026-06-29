import { useState } from 'react'
import { usePlanningStore } from '../../stores/planningStore'
import { useWeekPresets, useDayPresets } from '../../hooks/usePresets'
import { useWeekRange } from '../../hooks/useWeekRange'
import { getDayName, formatDayLabel } from '../../lib/date'
import type { Block } from '../../types'
import { Button } from '../ui/button'
import VariableBlockForm from './VariableBlockForm'

type DaySchedule = {
  dayLabel: string
  variableBlocks: Block[]
}

export default function StepFillBlocks() {
  const { weekPresetId, targetWeekStart, filledBlocks, setStep } = usePlanningStore()
  const { data: weekPresets = [] } = useWeekPresets()
  const { data: dayPresets = [] } = useDayPresets()
  const weekRange = useWeekRange(targetWeekStart)

  const [showErrors, setShowErrors] = useState(false)

  const weekPreset = weekPresets.find((p) => p.id === weekPresetId)

  const daySchedules: DaySchedule[] = (weekRange?.dates ?? []).map((date) => {
    const dayName = getDayName(date)
    const dayPresetId = weekPreset?.days[dayName]
    const dayPreset = dayPresets.find((dp) => dp.id === dayPresetId)
    const variableBlocks = dayPreset?.blocks.filter((b) => b.isVariable) ?? []
    return { dayLabel: formatDayLabel(date), variableBlocks }
  })

  const allVariableBlocks = daySchedules.flatMap((d) => d.variableBlocks)
  const hasVariableBlocks = allVariableBlocks.length > 0

  function validate() {
    return allVariableBlocks.every((b) => {
      const filled = filledBlocks[b.id]
      return filled && filled.title.trim().length > 0
    })
  }

  function handleNext() {
    if (!validate()) {
      setShowErrors(true)
      return
    }
    setStep(4)
  }

  // No variable blocks — skip to review
  if (!hasVariableBlocks) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-dashed border-input px-6 py-10 text-center">
          <p className="text-sm font-medium">No variable blocks</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {weekPresetId === null
              ? 'Blank week — nothing to fill in.'
              : 'This week preset has no variable blocks.'}
          </p>
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(2)}>
            Back
          </Button>
          <Button onClick={() => setStep(4)}>Review week</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Fill in what you're doing for each variable block.
      </p>

      {daySchedules.map(({ dayLabel, variableBlocks }) => {
        if (variableBlocks.length === 0) return null
        return (
          <div key={dayLabel} className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-muted-foreground">{dayLabel}</h3>
            {variableBlocks.map((block) => (
              <VariableBlockForm key={block.id} block={block} error={showErrors} />
            ))}
          </div>
        )
      })}

      {showErrors && !validate() && (
        <p className="text-sm text-destructive">Fill in all required fields before continuing.</p>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(2)}>
          Back
        </Button>
        <Button onClick={handleNext}>Review week</Button>
      </div>
    </div>
  )
}
