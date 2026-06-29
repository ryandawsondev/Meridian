import { useState } from 'react'
import { ChevronDown, ChevronUp, Pencil } from 'lucide-react'
import type { PreviewBlock } from '../../hooks/usePlanningPreview'
import { Button } from '../ui/button'

interface BlockCardProps {
  block: PreviewBlock
  onEdit?: () => void
  compact?: boolean
}

export default function BlockCard({ block, onEdit, compact = false }: BlockCardProps) {
  const [expanded, setExpanded] = useState(false)
  const hasSubTasks = (block.subTasks?.length ?? 0) > 0

  return (
    <div className="flex overflow-hidden rounded-lg border border-input bg-card">
      {/* Colour stripe */}
      <div className="w-1 shrink-0" style={{ backgroundColor: block.colour }} />

      {/* Content */}
      <div className="flex flex-1 flex-col px-3 py-2.5 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p
              className={`font-medium leading-tight ${compact ? 'text-xs' : 'text-sm'} ${
                block.isVariable && block.displayTitle === block.originalTitle
                  ? 'text-muted-foreground'
                  : ''
              }`}
            >
              {block.displayTitle}
            </p>
            <p className={`${compact ? 'text-[10px]' : 'text-xs'} text-muted-foreground`}>
              {block.startTime}–{block.endTime}
            </p>
            {!compact && block.notes && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{block.notes}</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {hasSubTasks && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={expanded ? 'Collapse sub-tasks' : 'Expand sub-tasks'}
              >
                {block.subTasks!.length}
                {expanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            )}
            {block.isVariable && onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onEdit}
                aria-label="Edit block"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Sub-tasks */}
        {expanded && hasSubTasks && (
          <ul className="mt-2 flex flex-col gap-1 border-l-2 border-border pl-3">
            {block.subTasks!.map((st, i) => (
              <li key={i}>
                <p className="text-xs font-medium">{st.title}</p>
                {st.notes && <p className="text-[10px] text-muted-foreground">{st.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
