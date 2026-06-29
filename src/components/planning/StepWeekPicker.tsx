import { CalendarDays } from 'lucide-react'
import { usePlanningStore } from '../../stores/planningStore'
import { useCurrentAndNextWeek } from '../../hooks/useWeekRange'
import { formatWeekLabel, fromISO } from '../../lib/date'

export default function StepWeekPicker() {
  const { setTargetWeekStart, setStep } = usePlanningStore()
  const { thisWeek, nextWeek } = useCurrentAndNextWeek()

  function pick(iso: string) {
    setTargetWeekStart(iso)
    setStep(3)
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">Which week are you planning for?</p>

      <WeekCard
        label="This week"
        range={formatWeekLabel(fromISO(thisWeek))}
        onSelect={() => pick(thisWeek)}
      />
      <WeekCard
        label="Next week"
        range={formatWeekLabel(fromISO(nextWeek))}
        onSelect={() => pick(nextWeek)}
      />
    </div>
  )
}

function WeekCard({
  label,
  range,
  onSelect,
}: {
  label: string
  range: string
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className="flex w-full items-center gap-4 rounded-xl border border-input bg-card px-5 py-4 text-left transition-colors hover:border-primary hover:bg-accent"
    >
      <CalendarDays className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div>
        <p className="font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{range}</p>
      </div>
    </button>
  )
}
