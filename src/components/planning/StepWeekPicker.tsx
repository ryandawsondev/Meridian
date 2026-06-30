import { useState } from 'react'
import { CalendarDays, Check } from 'lucide-react'
import { motion } from 'motion/react'
import { usePlanningStore } from '../../stores/planningStore'
import { useCurrentAndNextWeek } from '../../hooks/useWeekRange'
import { formatWeekLabel, fromISO } from '../../lib/date'
import { Button } from '../ui/button'

interface StepWeekPickerProps {
  onBack: () => void
  onNext: () => void
}

export default function StepWeekPicker({ onBack, onNext }: StepWeekPickerProps) {
  const { setTargetWeekStart } = usePlanningStore()
  const { thisWeek, nextWeek } = useCurrentAndNextWeek()
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)

  function handleNext() {
    if (!selectedWeek) return
    setTargetWeekStart(selectedWeek)
    onNext()
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">Which week are you planning for?</p>

      <WeekCard
        label="This week"
        range={formatWeekLabel(fromISO(thisWeek))}
        selected={selectedWeek === thisWeek}
        onSelect={() => setSelectedWeek(thisWeek)}
      />
      <WeekCard
        label="Next week"
        range={formatWeekLabel(fromISO(nextWeek))}
        selected={selectedWeek === nextWeek}
        onSelect={() => setSelectedWeek(nextWeek)}
      />

      <div className="mt-2 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={!selectedWeek}>
          Next
        </Button>
      </div>
    </div>
  )
}

function WeekCard({
  label,
  range,
  selected,
  onSelect,
}: {
  label: string
  range: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <motion.button
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
      className={`flex w-full items-center gap-4 rounded-xl border px-5 py-4 text-left transition-colors ${
        selected
          ? 'border-primary bg-primary/5'
          : 'border-input bg-card hover:border-primary hover:bg-accent'
      }`}
    >
      <CalendarDays className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{range}</p>
      </div>
      {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
    </motion.button>
  )
}
