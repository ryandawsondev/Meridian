import { useState, useMemo } from 'react'
import type { PreviewDay, PreviewBlock } from '../../hooks/usePlanningPreview'
import { haptic } from '../../lib/haptics'
import { timeToMinutes } from '../../lib/date'

interface DayViewProps {
  days: PreviewDay[]
  onEditBlock: (blockId: string, originalTitle: string, dateISO: string) => void
}

const HOUR_HEIGHT = 64 // px per hour
const LEFT_GUTTER = 48 // px for time labels
const MIN_BLOCK_HEIGHT = 22 // px

function minutesToPx(minutes: number): number {
  return (minutes / 60) * HOUR_HEIGHT
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const period = h < 12 ? 'AM' : 'PM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${hour} ${period}` : `${hour}:${String(m).padStart(2, '0')} ${period}`
}

function TimeGrid({ startHour, endHour }: { startHour: number; endHour: number }) {
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)
  return (
    <>
      {hours.map((h) => (
        <div
          key={h}
          className="pointer-events-none absolute flex w-full items-start"
          style={{ top: minutesToPx((h - startHour) * 60) }}
        >
          <span className="-mt-[6px] w-[48px] shrink-0 select-none pr-3 text-right text-[11px] leading-none text-muted-foreground">
            {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
          </span>
          <div className="flex-1 border-t border-border" />
        </div>
      ))}
    </>
  )
}

function BlockStrip({
  block,
  top,
  height,
  dateISO,
  onEdit,
}: {
  block: PreviewBlock
  top: number
  height: number
  dateISO: string
  onEdit: (blockId: string, originalTitle: string, dateISO: string) => void
}) {
  const isShort = height < 36

  return (
    <button
      onClick={() => {
        haptic('tap')
        onEdit(block.blockId, block.originalTitle, dateISO)
      }}
      className="absolute left-0 right-0 overflow-hidden rounded-md px-2 text-left transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:opacity-60"
      style={{
        top,
        height,
        backgroundColor: block.colour ? `${block.colour}26` : 'hsl(var(--primary) / 0.12)',
        borderLeft: `3px solid ${block.colour ?? 'hsl(var(--primary))'}`,
      }}
    >
      {isShort ? (
        <span
          className="mt-[4px] block truncate text-[11px] font-medium leading-none"
          style={{ color: block.colour ?? 'hsl(var(--primary))' }}
        >
          {block.displayTitle}
          <span className="ml-1.5 font-normal opacity-60">{formatTime(block.startTime)}</span>
        </span>
      ) : (
        <div className="flex h-full flex-col justify-center py-1">
          <span
            className="block truncate text-[12px] font-medium leading-tight"
            style={{ color: block.colour ?? 'hsl(var(--primary))' }}
          >
            {block.displayTitle}
          </span>
          <span className="mt-0.5 block text-[11px] leading-tight text-muted-foreground">
            {formatTime(block.startTime)} – {formatTime(block.endTime)}
          </span>
        </div>
      )}
    </button>
  )
}

function DayGrid({
  day,
  onEditBlock,
}: {
  day: PreviewDay
  onEditBlock: (blockId: string, originalTitle: string, dateISO: string) => void
}) {
  const { startHour, endHour } = useMemo(() => {
    if (day.blocks.length === 0) return { startHour: 6, endHour: 22 }
    const allMins = day.blocks.flatMap((b) => [
      timeToMinutes(b.startTime),
      timeToMinutes(b.endTime),
    ])
    return {
      startHour: Math.max(0, Math.floor(Math.min(...allMins) / 60) - 1),
      endHour: Math.min(23, Math.ceil(Math.max(...allMins) / 60) + 1),
    }
  }, [day.blocks])

  const positioned = useMemo(() => {
    const sorted = [...day.blocks].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    )

    // Pass 1: compute natural top and bottom for every block in px
    const rows = sorted.map((block) => ({
      block,
      top: minutesToPx(timeToMinutes(block.startTime) - startHour * 60),
      naturalBottom: minutesToPx(timeToMinutes(block.endTime) - startHour * 60),
    }))

    // Pass 2: cascade tops so no block overlaps the previous one.
    // If block[i-1].top + MIN_BLOCK_HEIGHT > block[i].top, push block[i] down.
    let prevBottom = -Infinity
    const cascaded = rows.map(({ block, top, naturalBottom }) => {
      const adjustedTop = Math.max(top, prevBottom)
      const height = Math.max(
        Math.min(naturalBottom, top + (naturalBottom - top)) - adjustedTop,
        MIN_BLOCK_HEIGHT
      )
      prevBottom = adjustedTop + height
      return { block, top: adjustedTop, height: Math.max(height - 1, 1) }
    })

    return cascaded
  }, [day.blocks, startHour])

  const totalHeight = minutesToPx((endHour - startHour + 1) * 60)

  return (
    <div className="relative" style={{ height: totalHeight }}>
      <TimeGrid startHour={startHour} endHour={endHour} />
      <div className="absolute inset-0" style={{ left: LEFT_GUTTER, paddingRight: 4 }}>
        {positioned.map(({ block, top, height }) => (
          <BlockStrip
            key={block.blockId}
            block={block}
            top={top}
            height={height}
            dateISO={day.dateISO}
            onEdit={onEditBlock}
          />
        ))}
      </div>
    </div>
  )
}

export default function DayView({ days, onEditBlock }: DayViewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  function navigate(i: number) {
    setSelectedIndex(i)
    haptic('tap')
  }

  const selectedDay = days[selectedIndex]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {days.map((day, i) => (
          <button
            key={day.dateISO}
            onClick={() => navigate(i)}
            className={`flex shrink-0 flex-col items-center rounded-lg px-3 py-2 transition-colors ${
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

      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-medium">{selectedDay.label}</p>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 560 }}>
          <div className="px-3 py-4">
            <DayGrid day={selectedDay} onEditBlock={onEditBlock} />
          </div>
        </div>
      </div>
    </div>
  )
}
