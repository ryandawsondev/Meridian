import { useState } from 'react'
import { Pencil } from 'lucide-react'
import type { PreviewDay, PreviewBlock } from '../../hooks/usePlanningPreview'

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function formatHourLabel(hour: number): string {
  if (hour === 0) return '12am'
  if (hour < 12) return `${hour}am`
  if (hour === 12) return '12pm'
  return `${hour - 12}pm`
}

interface DayViewProps {
  days: PreviewDay[]
  onEditBlock: (blockId: string, originalTitle: string, dateISO: string) => void
}

export default function DayView({ days, onEditBlock }: DayViewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectedDay = days[selectedIndex]

  const sorted = [...selectedDay.blocks].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  )

  const blocksByHour = new Map<number, PreviewBlock[]>()
  for (const block of sorted) {
    const hour = Math.floor(timeToMinutes(block.startTime) / 60)
    if (!blocksByHour.has(hour)) blocksByHour.set(hour, [])
    blocksByHour.get(hour)!.push(block)
  }

  const startHour = sorted.length > 0
    ? Math.max(0, Math.floor(timeToMinutes(sorted[0].startTime) / 60) - 1)
    : 8
  const endHour = sorted.length > 0
    ? Math.ceil(timeToMinutes(sorted[sorted.length - 1].endTime) / 60)
    : 18
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)

  return (
    <div className="flex flex-col gap-4">
      {/* Day selector */}
      <div className="flex overflow-x-auto gap-1 pb-1">
        {days.map((day, i) => (
          <button
            key={day.dateISO}
            onClick={() => setSelectedIndex(i)}
            className={`flex shrink-0 flex-col items-center rounded-lg px-3 py-2 text-center transition-colors ${
              i === selectedIndex
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide">
              {day.shortLabel}
            </span>
            <span className="text-sm font-medium">{day.date.getDate()}</span>
            {day.blocks.length > 0 && (
              <span className="mt-0.5 h-1 w-1 rounded-full bg-current opacity-50" />
            )}
          </button>
        ))}
      </div>

      {/* Block list */}
      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-input px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">No blocks</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {hours.map((hour) => {
            const blocks = blocksByHour.get(hour) ?? []
            return (
              <div key={hour}>
                {/* Hour label */}
                <div className="flex items-center gap-2 py-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground w-10 text-right shrink-0">
                    {formatHourLabel(hour)}
                  </span>
                  <div className="flex-1 border-t border-border/40" />
                </div>

                {/* Blocks in this hour */}
                {blocks.map((block) => (
                  <div key={block.blockId} className="flex items-center gap-2 py-0.5">
                    <span className="text-[10px] text-muted-foreground w-10 text-right shrink-0">
                      {block.startTime}
                    </span>
                    <div
                      className="flex h-11 flex-1 cursor-pointer items-center overflow-hidden rounded border px-2.5"
                      style={{
                        borderColor: block.colour,
                        backgroundColor: block.colour + '1a',
                        borderLeft: `3px solid ${block.colour}`,
                      }}
                      onClick={() => onEditBlock(block.blockId, block.originalTitle, selectedDay.dateISO)}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-semibold leading-tight text-foreground">
                          {block.displayTitle}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {block.startTime}–{block.endTime}
                        </p>
                      </div>
                      <Pencil className="ml-2 h-3 w-3 shrink-0 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
