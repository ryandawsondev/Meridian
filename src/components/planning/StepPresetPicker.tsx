import { useState } from 'react'
import { CalendarDays, LayoutGrid, Check } from 'lucide-react'
import { motion } from 'motion/react'
import { useWeekPresets } from '../../hooks/usePresets'
import { usePlanningStore } from '../../stores/planningStore'
import type { WeekPreset } from '../../types'
import { Button } from '../ui/button'

type Selection = { type: 'blank' } | { type: 'preset'; id: string } | null

const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

function PresetCard({
  preset,
  selected,
  onSelect,
}: {
  preset: WeekPreset
  selected: boolean
  onSelect: () => void
}) {
  const filledCount = Object.values(preset.days).filter(Boolean).length
  return (
    <motion.button
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
      className={`flex w-full items-start gap-4 rounded-xl border px-5 py-4 text-left transition-colors ${
        selected
          ? 'border-primary bg-primary/5'
          : 'border-input bg-card hover:border-primary hover:bg-accent'
      }`}
    >
      <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{preset.name}</p>
        <div className="mt-1.5 flex gap-1">
          {DAY_KEYS.map((day, i) => (
            <div
              key={day}
              className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-medium ${
                preset.days[day]
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {DAY_INITIALS[i]}
            </div>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{filledCount} of 7 days</p>
      </div>
      {selected && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
    </motion.button>
  )
}

interface StepPresetPickerProps {
  onNext: () => void
}

export default function StepPresetPicker({ onNext }: StepPresetPickerProps) {
  const { data: presets = [], isLoading } = useWeekPresets()
  const { setWeekPresetId } = usePlanningStore()
  const [selection, setSelection] = useState<Selection>(null)

  function handleNext() {
    if (!selection) return
    setWeekPresetId(selection.type === 'blank' ? null : selection.id)
    onNext()
  }

  const isBlankSelected = selection?.type === 'blank'

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Pick a week preset to start from, or start with a blank week.
      </p>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {!isLoading && (
        <motion.div
          className="flex flex-col gap-3"
          variants={listVariants}
          initial="hidden"
          animate="show"
        >
          {/* Blank week */}
          <motion.div variants={itemVariants}>
            <motion.button
              onClick={() => setSelection({ type: 'blank' })}
              whileTap={{ scale: 0.98 }}
              className={`flex w-full items-start gap-4 rounded-xl border border-dashed px-5 py-4 text-left transition-colors ${
                isBlankSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-input bg-card hover:border-primary hover:bg-accent'
              }`}
            >
              <LayoutGrid className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Blank week</p>
                <p className="mt-0.5 text-xs text-muted-foreground">No preset — build the week manually in preview</p>
              </div>
              {isBlankSelected && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
            </motion.button>
          </motion.div>

          {presets.map((preset) => (
            <motion.div key={preset.id} variants={itemVariants}>
              <PresetCard
                preset={preset}
                selected={selection?.type === 'preset' && selection.id === preset.id}
                onSelect={() => setSelection({ type: 'preset', id: preset.id })}
              />
            </motion.div>
          ))}

          {presets.length === 0 && (
            <p className="py-2 text-center text-xs text-muted-foreground">
              No week presets yet — create some in the Presets tab.
            </p>
          )}
        </motion.div>
      )}

      <div className="mt-2 flex justify-end">
        <Button onClick={handleNext} disabled={!selection}>
          Next
        </Button>
      </div>
    </div>
  )
}
