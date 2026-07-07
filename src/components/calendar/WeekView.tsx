import { useMemo } from 'react'
import type { PreviewDay } from '../../hooks/usePlanningPreview'
import { haptic } from '../../lib/haptics'
import { timeToMinutes } from '../../lib/date'

interface WeekViewProps {
  days: PreviewDay[]
  onEditBlock: (blockId: string, originalTitle: string, dateISO: string) => void
}

const HOUR_HEIGHT = 48 // slightly shorter than DayView since 7 columns are narrow
const LEFT_GUTTER = 36 // px for time labels
const MIN_BLOCK_HEIGHT = 18 // px

function minutesToPx(minutes: number): number {
  return (minutes / 60) * HOUR_HEIGHT
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const period = h < 12 ? 'AM' : 'PM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${hour}${period}` : `${hour}:${String(m).padStart(2, '0')}${period}`
}

function positionBlocks(
  day: PreviewDay,
  startHour: number
): { block: PreviewDay['blocks'][number]; top: number; height: number }[] {
  const sorted = [...day.blocks].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  )

  const rows = sorted.map((block) => ({
    block,
    top: minutesToPx(timeToMinutes(block.startTime) - startHour * 60),
    naturalBottom: minutesToPx(timeToMinutes(block.endTime) - startHour * 60),
  }))

  let prevBottom = -Infinity
  return rows.map(({ block, top, naturalBottom }) => {
    const adjustedTop = Math.max(top, prevBottom)
    const height = Math.max(naturalBottom - adjustedTop, MIN_BLOCK_HEIGHT)
    prevBottom = adjustedTop + height
    return { block, top: adjustedTop, height: Math.max(height - 1, 1) }
  })
}

export default function WeekView({ days, onEditBlock }: WeekViewProps) {
  const { startHour, endHour } = useMemo(() => {
    const allBlocks = days.flatMap((d) => d.blocks)
    if (allBlocks.length === 0) return { startHour: 6, endHour: 22 }
    const allMins = allBlocks.flatMap((b) => [timeToMinutes(b.startTime), timeToMinutes(b.endTime)])
    return {
      startHour: Math.max(0, Math.floor(Math.min(...allMins) / 60) - 1),
      endHour: Math.min(23, Math.ceil(Math.max(...allMins) / 60) + 1),
    }
  }, [days])

  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)
  const totalHeight = minutesToPx((endHour - startHour + 1) * 60)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      {/* Day header row */}
      <div className="flex border-b border-border">
        <div className="shrink-0" style={{ width: LEFT_GUTTER }} />
        {days.map((day) => (
          <div
            key={day.dateISO}
            className="min-w-0 flex-1 border-l border-border py-2 text-center first:border-l-0"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {day.shortLabel}
            </p>
            <p className="text-sm font-medium leading-tight">{day.date.getDate()}</p>
          </div>
        ))}
      </div>

      {/* Scrollable grid body */}
      <div className="overflow-y-auto" style={{ maxHeight: 560 }}>
        <div className="flex" style={{ height: totalHeight }}>
          {/* Time gutter */}
          <div className="relative shrink-0" style={{ width: LEFT_GUTTER }}>
            {hours.map((h) => (
              <div
                key={h}
                className="pointer-events-none absolute flex w-full justify-end pr-1"
                style={{ top: minutesToPx((h - startHour) * 60) - 6 }}
              >
                <span className="select-none text-[10px] leading-none text-muted-foreground">
                  {h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const blocks = positionBlocks(day, startHour)
            return (
              <div key={day.dateISO} className="relative min-w-0 flex-1 border-l border-border">
                {/* Hour lines */}
                {hours.map((h) => (
                  <div
                    key={h}
                    className="pointer-events-none absolute w-full border-t border-border"
                    style={{ top: minutesToPx((h - startHour) * 60) }}
                  />
                ))}

                {/* Blocks */}
                {blocks.map(({ block, top, height }) => (
                  <button
                    key={block.blockId}
                    onClick={() => {
                      haptic('tap')
                      onEditBlock(block.blockId, block.originalTitle, day.dateISO)
                    }}
                    className="absolute inset-x-0.5 overflow-hidden rounded text-left transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:opacity-60"
                    style={{
                      top,
                      height,
                      backgroundColor: block.colour
                        ? `${block.colour}26`
                        : 'hsl(var(--primary) / 0.12)',
                      borderLeft: `2px solid ${block.colour ?? 'hsl(var(--primary))'}`,
                    }}
                  >
                    <span
                      className="mt-[2px] block truncate px-1 text-[10px] font-medium leading-tight"
                      style={{ color: block.colour ?? 'hsl(var(--primary))' }}
                    >
                      {block.displayTitle}
                    </span>
                    {height >= 32 && (
                      <span className="block truncate px-1 text-[9px] leading-tight text-muted-foreground">
                        {formatTime(block.startTime)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
