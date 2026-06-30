import { useState } from 'react'
import { CalendarDays, LayoutGrid, Check } from 'lucide-react'
import { useWeekPresets } from '../../hooks/usePresets'
import { usePlanningStore } from '../../stores/planningStore'
import type { WeekPreset } from '../../types'
import { Button } from '../ui/button'

type Selection = { type: 'blank' } | { type: 'preset'; id: string } | null

const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

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
    <button
      onClick={onSelect}
      className={`flex w-full items-start gap-4 rounded-xl border px-5 py-4 text-left transition-colors ${
        selected
          ? 'border-primary bg-primary/5'
          : 'border-input bg-card hover:border-primary hover:bg-accent'
      }`}
    >
      <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
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
    </button>
  )
}

export default function StepPresetPicker() {
  const { data: presets = [], isLoading } = useWeekPresets()
  const { setWeekPresetId, setStep } = usePlanningStore()
  const [selection, setSelection] = useState<Selection>(null)

  function handleNext() {
    if (!selection) return
    setWeekPresetId(selection.type === 'blank' ? null : selection.id)
    setStep(2)
  }

  const isBlankSelected = selection?.type === 'blank'

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Pick a week preset to start from, or start with a blank week.
      </p>

      {/* Blank week */}
      <button
        onClick={() => setSelection({ type: 'blank' })}
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
      </button>

      {isLoading && (
        <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
      )}

      {presets.map((preset) => (
        <PresetCard
          key={preset.id}
          preset={preset}
          selected={selection?.type === 'preset' && selection.id === preset.id}
          onSelect={() => setSelection({ type: 'preset', id: preset.id })}
        />
      ))}

      {!isLoading && presets.length === 0 && (
        <p className="py-2 text-center text-xs text-muted-foreground">
          No week presets yet — create some in the Presets tab.
        </p>
      )}

      <div className="mt-2 flex justify-end">
        <Button onClick={handleNext} disabled={!selection}>
          Next
        </Button>
      </div>
    </div>
  )
}
