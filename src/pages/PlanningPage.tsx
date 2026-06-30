import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { usePlanningStore } from '../stores/planningStore'
import type { PlanningStep } from '../stores/planningStore'
import StepPresetPicker from '../components/planning/StepPresetPicker'
import StepWeekPicker from '../components/planning/StepWeekPicker'
import StepFillBlocks from '../components/planning/StepFillBlocks'
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
}

const STEP_VARIANTS = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 24 : -24 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -24 : 24 }),
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
      {[1, 2, 3].map((n) => (
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
          {n < 3 && (
            <motion.div
              className="h-px w-6"
              animate={{ backgroundColor: n < current ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}
              transition={{ duration: 0.3 }}
            />
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
  const [direction, setDirection] = useState(1)

  function handleStepJump(newStep: PlanningStep) {
    setDirection(newStep > step ? 1 : -1)
    setStep(newStep)
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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
        <StepIndicator current={step} onJump={handleStepJump} />
      </div>

      {/* Step content — direction-aware slide */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={STEP_VARIANTS}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {step === 1 && <StepPresetPicker onNext={() => { setDirection(1); setStep(2) }} />}
          {step === 2 && <StepWeekPicker onBack={() => { setDirection(-1); setStep(1) }} onNext={() => { setDirection(1); setStep(3) }} />}
          {step === 3 && <StepFillBlocks onBack={() => { setDirection(-1); setStep(2) }} />}
        </motion.div>
      </AnimatePresence>

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
