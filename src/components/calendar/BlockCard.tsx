import { useState } from 'react'
import { ChevronDown, ChevronUp, Pencil } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import type { PreviewBlock } from '../../hooks/usePlanningPreview'

interface BlockCardProps {
  block: PreviewBlock
  onEdit?: () => void
  compact?: boolean
}

function calcDuration(start: string, end: string): string {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  if (mins <= 0) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export default function BlockCard({ block, onEdit, compact = false }: BlockCardProps) {
  const [expanded, setExpanded] = useState(false)
  const hasSubTasks = (block.subTasks?.length ?? 0) > 0
  const duration = calcDuration(block.startTime, block.endTime)

  return (
    <motion.div
      className="flex overflow-hidden rounded-lg border border-input bg-card"
      whileHover={!compact ? { y: -1 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Colour stripe — 4px for visibility */}
      <div className="w-[4px] shrink-0" style={{ backgroundColor: block.colour }} />

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
            {/* Time display is now foreground-weight, not muted */}
            <p className={`mt-0.5 font-medium ${compact ? 'text-[10px]' : 'text-xs'} text-foreground/70`}>
              {block.startTime}–{block.endTime}
              {!compact && duration && (
                <span className="ml-1.5 font-normal text-muted-foreground">· {duration}</span>
              )}
            </p>
            {!compact && block.notes && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{block.notes}</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {hasSubTasks && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="-m-1 flex items-center gap-0.5 rounded p-1 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
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
              <button
                className="-m-1 flex h-8 w-8 items-center justify-center rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={onEdit}
                aria-label="Edit block"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Sub-tasks — animated height */}
        <AnimatePresence>
          {expanded && hasSubTasks && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="mt-2 flex flex-col gap-1 border-l-2 border-border pl-3">
                {block.subTasks!.map((st, i) => (
                  <li key={i} className="list-none">
                    <p className="text-xs font-medium">{st.title}</p>
                    {st.notes && <p className="text-[10px] text-muted-foreground">{st.notes}</p>}
                  </li>
                ))}
              </div>
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
