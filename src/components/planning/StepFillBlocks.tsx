import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { usePlanningStore } from '../../stores/planningStore'
import { useWeekPresets, useDayPresets } from '../../hooks/usePresets'
import { useWeekRange } from '../../hooks/useWeekRange'
import { getDayName, formatDayLabel, toISO } from '../../lib/date'
import type { Block } from '../../types'
import { Button } from '../ui/button'
import VariableBlockForm from './VariableBlockForm'

type DaySchedule = {
  dayLabel: string
  dateISO: string
  variableBlocks: Block[]
}

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.18 } },
}

interface StepFillBlocksProps {
  onBack: () => void
}

export default function StepFillBlocks({ onBack }: StepFillBlocksProps) {
  const navigate = useNavigate()
  const { weekPresetId, targetWeekStart, filledBlocks } = usePlanningStore()
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
    return { dayLabel: formatDayLabel(date), dateISO: toISO(date), variableBlocks }
  })

  const allVariableBlocks = daySchedules.flatMap((d) =>
    d.variableBlocks.map((b) => ({ block: b, dateISO: d.dateISO }))
  )
  const hasVariableBlocks = allVariableBlocks.length > 0

  function validate() {
    return allVariableBlocks.every(({ block, dateISO }) => {
      const filled = filledBlocks[`${dateISO}_${block.id}`]
      return filled && filled.title.trim().length > 0
    })
  }

  function handleNext() {
    if (!validate()) {
      setShowErrors(true)
      return
    }
    navigate('/preview')
  }

  // No variable blocks — skip directly to preview
  if (!hasVariableBlocks) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-dashed border-input px-6 py-10 text-center">
          <p className="text-sm font-medium">Nothing to fill in</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {weekPresetId === null
              ? 'Blank week — add events directly in preview.'
              : 'All blocks have fixed titles — nothing to customise this week.'}
          </p>
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={() => navigate('/preview')}>Go to preview</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Fill in what you're actually doing for each variable block this week.
      </p>

      <motion.div
        className="flex flex-col gap-6"
        variants={listVariants}
        initial="hidden"
        animate="show"
      >
        {daySchedules.map(({ dayLabel, dateISO, variableBlocks }) => {
          if (variableBlocks.length === 0) return null
          return (
            <motion.div key={dayLabel} variants={itemVariants} className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-muted-foreground">{dayLabel}</h3>
              {variableBlocks.map((block) => (
                <VariableBlockForm
                  key={`${dateISO}_${block.id}`}
                  block={block}
                  dayDate={dateISO}
                  error={showErrors}
                />
              ))}
            </motion.div>
          )
        })}
      </motion.div>

      {showErrors && !validate() && (
        <p className="text-sm text-destructive">Fill in all required fields before continuing.</p>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext}>Go to preview</Button>
      </div>
    </div>
  )
}
