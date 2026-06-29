import type { PreviewDay } from '../../hooks/usePlanningPreview'
import BlockCard from './BlockCard'

interface ListViewProps {
  days: PreviewDay[]
  onEditBlock: (blockId: string, originalTitle: string) => void
}

export default function ListView({ days, onEditBlock }: ListViewProps) {
  const nonEmptyDays = days.filter((d) => d.blocks.length > 0)

  if (nonEmptyDays.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-input text-sm text-muted-foreground">
        No blocks this week
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {nonEmptyDays.map((day) => (
        <div key={day.dateISO}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {day.label}
          </p>
          <div className="flex flex-col gap-2">
            {day.blocks.map((block) => (
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
        </div>
      ))}
    </div>
  )
}
