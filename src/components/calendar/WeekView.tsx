import type { PreviewDay } from '../../hooks/usePlanningPreview'
import BlockCard from './BlockCard'

interface WeekViewProps {
  days: PreviewDay[]
  onEditBlock: (blockId: string, originalTitle: string, dateISO: string) => void
}

export default function WeekView({ days, onEditBlock }: WeekViewProps) {
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[560px] grid-cols-7 gap-1">
        {/* Day headers */}
        {days.map((day) => (
          <div
            key={day.dateISO}
            className="px-1 pb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            <div>{day.shortLabel}</div>
            <div className="text-foreground">{day.date.getDate()}</div>
          </div>
        ))}

        {/* Block columns */}
        {days.map((day) => (
          <div key={day.dateISO} className="flex flex-col gap-1 min-h-[60px]">
            {day.blocks.map((block) => (
              <BlockCard
                key={block.blockId}
                block={block}
                compact
                onEdit={
                  block.isVariable
                    ? () => onEditBlock(block.blockId, block.originalTitle, day.dateISO)
                    : undefined
                }
              />
            ))}
            {day.blocks.length === 0 && (
              <div className="rounded border border-dashed border-input/50 h-12" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
