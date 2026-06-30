import { useEffect, useRef, useState } from 'react'
import { usePlanningStore } from '../stores/planningStore'
import type { PlanningStep } from '../stores/planningStore'
import StepPresetPicker from '../components/planning/StepPresetPicker'
import StepWeekPicker from '../components/planning/StepWeekPicker'
import StepFillBlocks from '../components/planning/StepFillBlocks'
import StepReview from '../components/planning/StepReview'
import { Button } from '../components/ui/button'
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

const STEP_LABELS: Record<number, string> = {
  1: 'Choose preset',
  2: 'Choose week',
  3: 'Fill blocks',
  4: 'Review',
}

function StepIndicator({
  current,
  onJump,
}: {
  current: number
  onJump: (step: PlanningStep) => void
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="flex items-center gap-1">
          <button
            onClick={() => n < current && onJump(n as PlanningStep)}
            disabled={n >= current}
            aria-label={`${STEP_LABELS[n]}${n < current ? ' (click to go back)' : ''}`}
            title={n < current ? `Go back to: ${STEP_LABELS[n]}` : STEP_LABELS[n]}
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors ${
              n < current
                ? 'cursor-pointer bg-primary text-primary-foreground hover:opacity-80'
                : n === current
                ? 'cursor-default bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                : 'cursor-default bg-muted text-muted-foreground'
            }`}
          >
            {n}
          </button>
          {n < 4 && (
            <div className={`h-px w-6 ${n < current ? 'bg-primary' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function PlanningPage() {
  const { step, clearSession, setStep } = usePlanningStore()
  const topRef = useRef<HTMLDivElement>(null)
  const [startOverOpen, setStartOverOpen] = useState(false)

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [step])

  function handleStartOver() {
    clearSession()
    setStartOverOpen(false)
  }

  return (
    <div ref={topRef} className="mx-auto w-full max-w-lg px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Plan your week</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">{STEP_LABELS[step]}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStartOverOpen(true)}
          className="text-xs text-muted-foreground"
        >
          Start over
        </Button>
      </div>

      {/* Step indicator */}
      <div className="mb-6">
        <StepIndicator current={step} onJump={setStep} />
      </div>

      {/* Step content */}
      {step === 1 && <StepPresetPicker />}
      {step === 2 && <StepWeekPicker />}
      {step === 3 && <StepFillBlocks />}
      {step === 4 && <StepReview />}

      {/* Start over confirm */}
      <AlertDialog open={startOverOpen} onOpenChange={setStartOverOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start over?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear your current selections and any filled blocks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStartOver}>Start over</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
