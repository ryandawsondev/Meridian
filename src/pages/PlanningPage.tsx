import { usePlanningStore } from '../stores/planningStore'
import StepPresetPicker from '../components/planning/StepPresetPicker'
import StepWeekPicker from '../components/planning/StepWeekPicker'
import StepFillBlocks from '../components/planning/StepFillBlocks'
import StepReview from '../components/planning/StepReview'
import { Button } from '../components/ui/button'

const STEP_LABELS: Record<number, string> = {
  1: 'Choose preset',
  2: 'Choose week',
  3: 'Fill blocks',
  4: 'Review',
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="flex items-center gap-1">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
              n < current
                ? 'bg-primary text-primary-foreground'
                : n === current
                ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {n}
          </div>
          {n < 4 && (
            <div className={`h-px w-6 ${n < current ? 'bg-primary' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function PlanningPage() {
  const { step, clearSession } = usePlanningStore()

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Plan your week</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">{STEP_LABELS[step]}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearSession}
          className="text-xs text-muted-foreground"
        >
          Start over
        </Button>
      </div>

      {/* Step indicator */}
      <div className="mb-6">
        <StepIndicator current={step} />
      </div>

      {/* Step content */}
      {step === 1 && <StepPresetPicker />}
      {step === 2 && <StepWeekPicker />}
      {step === 3 && <StepFillBlocks />}
      {step === 4 && <StepReview />}
    </div>
  )
}
