import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
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
  error?: boolean
}

export default function VariableBlockForm({ block, error }: VariableBlockFormProps) {
  const { filledBlocks, setFilledBlock } = usePlanningStore()
  const existing = filledBlocks[block.id]

  const [title, setTitle] = useState(existing?.title ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [showSubTasks, setShowSubTasks] = useState(
    existing?.subTasks != null && existing.subTasks.length > 0
  )
  const [subTasks, setSubTasks] = useState<SubTask[]>(
    existing?.subTasks?.map((s) => ({ title: s.title, notes: s.notes ?? '' })) ?? []
  )

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
    setFilledBlock(block.id, filled)
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
      className={`flex flex-col gap-3 rounded-lg border px-4 py-4 ${
        error && !title.trim() ? 'border-destructive' : 'border-input'
      }`}
    >
      {/* Block meta */}
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: block.colour }} />
        <span className="text-xs text-muted-foreground">
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
          className={error && !title.trim() ? 'border-destructive' : ''}
        />
        {error && !title.trim() && (
          <p className="text-xs text-destructive">Required</p>
        )}
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
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        {showSubTasks ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
        {showSubTasks ? 'Hide sub-tasks' : 'Add sub-tasks'}
      </button>

      {/* Sub-tasks */}
      {showSubTasks && (
        <div className="flex flex-col gap-2 pl-2 border-l-2 border-border">
          {subTasks.map((task, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Input
                  placeholder={`Sub-task ${i + 1}`}
                  value={task.title}
                  onChange={(e) => handleSubTaskChange(i, 'title', e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => removeSubTask(i)}
                  aria-label="Remove sub-task"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
              <Input
                placeholder="Notes (optional)"
                value={task.notes}
                onChange={(e) => handleSubTaskChange(i, 'notes', e.target.value)}
              />
            </div>
          ))}
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
      )}
    </div>
  )
}
