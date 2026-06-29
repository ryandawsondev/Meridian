import { CalendarDays, LayoutGrid } from 'lucide-react'
import { useWeekPresets } from '../../hooks/usePresets'
import { usePlanningStore } from '../../stores/planningStore'
import type { WeekPreset } from '../../types'

const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

function PresetCard({ preset, onSelect }: { preset: WeekPreset; onSelect: () => void }) {
  const filledCount = Object.values(preset.days).filter(Boolean).length
  return (
    <button
      onClick={onSelect}
      className="flex w-full items-start gap-4 rounded-xl border border-input bg-card px-5 py-4 text-left transition-colors hover:border-primary hover:bg-accent"
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
    </button>
  )
}

export default function StepPresetPicker() {
  const { data: presets = [], isLoading } = useWeekPresets()
  const { setWeekPresetId, setStep } = usePlanningStore()

  function pick(id: string | null) {
    setWeekPresetId(id)
    setStep(2)
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Pick a week preset to start from, or start with a blank week.
      </p>

      {/* Blank week */}
      <button
        onClick={() => pick(null)}
        className="flex w-full items-start gap-4 rounded-xl border border-dashed border-input bg-card px-5 py-4 text-left transition-colors hover:border-primary hover:bg-accent"
      >
        <LayoutGrid className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div>
          <p className="font-medium">Blank week</p>
          <p className="mt-0.5 text-xs text-muted-foreground">No preset — build the week manually in preview</p>
        </div>
      </button>

      {isLoading && (
        <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
      )}

      {presets.map((preset) => (
        <PresetCard key={preset.id} preset={preset} onSelect={() => pick(preset.id)} />
      ))}

      {!isLoading && presets.length === 0 && (
        <p className="py-2 text-center text-xs text-muted-foreground">
          No week presets yet — create some in the Presets tab.
        </p>
      )}
    </div>
  )
}
