import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import type { Block, FilledBlock } from '../../types'
import { usePlanningStore } from '../../stores/planningStore'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'

interface SubTask {
  title: string
  notes: string
}

interface VariableBlockFormProps {
  block: Block
  dayDate: string
  error?: boolean
}

export default function VariableBlockForm({ block, dayDate, error }: VariableBlockFormProps) {
  const { filledBlocks, setFilledBlock } = usePlanningStore()
  const fillKey = `${dayDate}_${block.id}`
  const existing = filledBlocks[fillKey]

  const [title, setTitle] = useState(existing?.title ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [titleTouched, setTitleTouched] = useState(false)
  const [showSubTasks, setShowSubTasks] = useState(
    existing?.subTasks != null && existing.subTasks.length > 0
  )
  const [subTasks, setSubTasks] = useState<SubTask[]>(
    existing?.subTasks?.map((s) => ({ title: s.title, notes: s.notes ?? '' })) ?? []
  )

  const showTitleError = (error || titleTouched) && !title.trim()
  const isFilled = title.trim().length > 0

  function sync(
    nextTitle: string,
    nextNotes: string,
    nextSubTasks: SubTask[],
    nextShowSubTasks: boolean
  ) {
    const filled: FilledBlock = {
      blockId: block.id,
      title: nextTitle,
      notes: nextNotes || undefined,
      subTasks:
        nextShowSubTasks && nextSubTasks.length > 0
          ? nextSubTasks.map((s) => ({ title: s.title, notes: s.notes || undefined }))
          : undefined,
    }
    setFilledBlock(fillKey, filled)
  }

  function handleTitleChange(v: string) {
    setTitle(v)
    sync(v, notes, subTasks, showSubTasks)
  }

  function handleNotesChange(v: string) {
    setNotes(v)
    sync(title, v, subTasks, showSubTasks)
  }

  function handleSubTaskChange(index: number, field: keyof SubTask, value: string) {
    const next = subTasks.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    setSubTasks(next)
    sync(title, notes, next, showSubTasks)
  }

  function addSubTask() {
    const next = [...subTasks, { title: '', notes: '' }]
    setSubTasks(next)
    sync(title, notes, next, showSubTasks)
  }

  function removeSubTask(index: number) {
    const next = subTasks.filter((_, i) => i !== index)
    setSubTasks(next)
    sync(title, notes, next, showSubTasks)
  }

  function toggleSubTasks() {
    const next = !showSubTasks
    setShowSubTasks(next)
    if (next && subTasks.length === 0) {
      const first = [{ title: '', notes: '' }]
      setSubTasks(first)
      sync(title, notes, first, next)
    } else {
      sync(title, notes, subTasks, next)
    }
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border px-4 py-4 transition-colors ${
        showTitleError
          ? 'border-destructive'
          : isFilled
          ? 'border-input'
          : 'border-dashed border-input'
      }`}
    >
      {/* Block meta */}
      <div className="flex items-center gap-2">
        <div
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: block.colour }}
        />
        <span className="text-sm font-medium text-foreground">
          {block.startTime}–{block.endTime}
        </span>
        {block.notes && (
          <span className="text-xs text-muted-foreground">· {block.notes}</span>
        )}
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`block-title-${block.id}`}>
          What are you doing? <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`block-title-${block.id}`}
          placeholder={`e.g. ${block.title}`}
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          onBlur={() => setTitleTouched(true)}
          className={showTitleError ? 'border-destructive' : ''}
        />
        <AnimatePresence>
          {showTitleError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="text-xs text-destructive"
            >
              Required
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`block-notes-${block.id}`}>Notes</Label>
        <Textarea
          id={`block-notes-${block.id}`}
          placeholder="Any notes for this session…"
          rows={2}
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
        />
      </div>

      {/* Sub-tasks toggle */}
      <button
        type="button"
        onClick={toggleSubTasks}
        className="flex w-fit items-center gap-1.5 rounded-md border border-dashed border-input px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-input hover:bg-muted hover:text-foreground"
      >
        <Plus className={`h-3.5 w-3.5 transition-transform ${showSubTasks ? 'rotate-45' : ''}`} />
        {showSubTasks ? 'Hide sub-tasks' : 'Add sub-tasks'}
      </button>

      {/* Sub-tasks */}
      <AnimatePresence>
        {showSubTasks && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 border-l-2 border-border pl-3 pt-1">
              <AnimatePresence>
                {subTasks.map((task, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col gap-1.5 overflow-hidden"
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder={`Sub-task ${i + 1}`}
                        value={task.title}
                        onChange={(e) => handleSubTaskChange(i, 'title', e.target.value)}
                        className="flex-1"
                      />
                      <button
                        type="button"
                        className="-m-1 flex h-9 w-9 items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        onClick={() => removeSubTask(i)}
                        aria-label="Remove sub-task"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Input
                      placeholder="Notes (optional)"
                      value={task.notes}
                      onChange={(e) => handleSubTaskChange(i, 'notes', e.target.value)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSubTask}
                className="w-fit"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add sub-task
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
