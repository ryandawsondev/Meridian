import { useState } from 'react'
import type { PreviewDay, PreviewBlock } from '../../hooks/usePlanningPreview'
import BlockCard from './BlockCard'

const HOUR_HEIGHT = 64 // px per hour
const DEFAULT_MIN_HOUR = 6
const DEFAULT_MAX_HOUR = 22

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function computeTimeRange(blocks: PreviewBlock[]): { minHour: number; maxHour: number } {
  if (blocks.length === 0) {
    return { minHour: DEFAULT_MIN_HOUR, maxHour: DEFAULT_MAX_HOUR }
  }
  const starts = blocks.map((b) => Math.floor(timeToMinutes(b.startTime) / 60))
  const ends = blocks.map((b) => Math.ceil(timeToMinutes(b.endTime) / 60))
  const minHour = Math.max(0, Math.min(...starts) - 1)
  const maxHour = Math.min(24, Math.max(...ends) + 1)
  return { minHour, maxHour }
}

interface DayViewProps {
  days: PreviewDay[]
  onEditBlock: (blockId: string, originalTitle: string) => void
}

export default function DayView({ days, onEditBlock }: DayViewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectedDay = days[selectedIndex]
  const { minHour, maxHour } = computeTimeRange(selectedDay.blocks)
  const totalHours = maxHour - minHour
  const containerHeight = totalHours * HOUR_HEIGHT

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

      {/* Timeline */}
      <div className="relative flex" style={{ height: containerHeight }}>
        {/* Hour labels */}
        <div className="flex flex-col shrink-0 pr-3" style={{ height: containerHeight }}>
          {Array.from({ length: totalHours + 1 }, (_, i) => {
            const hour = minHour + i
            return (
              <div
                key={hour}
                className="flex items-start justify-end"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="text-[10px] text-muted-foreground">
                  {hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`}
                </span>
              </div>
            )
          })}
        </div>

        {/* Grid lines + blocks */}
        <div className="relative flex-1 border-l border-border" style={{ height: containerHeight }}>
          {/* Hour grid lines */}
          {Array.from({ length: totalHours + 1 }, (_, i) => (
            <div
              key={i}
              className="absolute w-full border-t border-border/50"
              style={{ top: i * HOUR_HEIGHT }}
            />
          ))}

          {/* Blocks */}
          {selectedDay.blocks.map((block) => {
            const startMin = timeToMinutes(block.startTime)
            const endMin = timeToMinutes(block.endTime)
            const top = ((startMin - minHour * 60) / 60) * HOUR_HEIGHT
            const height = Math.max(24, ((endMin - startMin) / 60) * HOUR_HEIGHT - 4)

            return (
              <div
                key={block.blockId}
                className="absolute left-1 right-1"
                style={{ top, height }}
              >
                <div
                  className="h-full overflow-hidden rounded border"
                  style={{
                    borderColor: block.colour,
                    backgroundColor: block.colour + '1a',
                  }}
                >
                  <div
                    className="flex h-full flex-col justify-start p-1.5"
                    style={{ borderLeft: `3px solid ${block.colour}` }}
                  >
                    <p className="text-[11px] font-semibold leading-tight text-foreground line-clamp-1">
                      {block.displayTitle}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {block.startTime}–{block.endTime}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}

          {selectedDay.blocks.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">No blocks</p>
            </div>
          )}
        </div>
      </div>

      {/* Block detail list below timeline (for edit access + notes) */}
      {selectedDay.blocks.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Details
          </p>
          {selectedDay.blocks.map((block) => (
            <BlockCard
              key={block.blockId}
              block={block}
              onEdit={
                block.isVariable
                  ? () => onEditBlock(block.blockId, block.originalTitle)
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
