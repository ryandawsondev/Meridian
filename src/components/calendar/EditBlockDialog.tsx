import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { usePlanningStore } from '../../stores/planningStore'
import type { FilledBlock } from '../../types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'

interface EditBlockDialogProps {
  blockId: string
  originalTitle: string
  onClose: () => void
}

interface SubTask {
  title: string
  notes: string
}

export default function EditBlockDialog({
  blockId,
  originalTitle,
  onClose,
}: EditBlockDialogProps) {
  const { filledBlocks, setFilledBlock } = usePlanningStore()
  const existing = filledBlocks[blockId]

  const [title, setTitle] = useState(existing?.title ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [subTasks, setSubTasks] = useState<SubTask[]>(
    existing?.subTasks?.map((s) => ({ title: s.title, notes: s.notes ?? '' })) ?? []
  )
  const [titleError, setTitleError] = useState(false)

  function handleSave() {
    if (!title.trim()) {
      setTitleError(true)
      return
    }
    const filled: FilledBlock = {
      blockId,
      title: title.trim(),
      notes: notes.trim() || undefined,
      subTasks:
        subTasks.length > 0
          ? subTasks.map((s) => ({ title: s.title, notes: s.notes || undefined }))
          : undefined,
    }
    setFilledBlock(blockId, filled)
    onClose()
  }

  function addSubTask() {
    setSubTasks([...subTasks, { title: '', notes: '' }])
  }

  function removeSubTask(index: number) {
    setSubTasks(subTasks.filter((_, i) => i !== index))
  }

  function updateSubTask(index: number, field: keyof SubTask, value: string) {
    setSubTasks(subTasks.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit block</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-title"
              placeholder={originalTitle}
              value={title}
              onChange={(e) => { setTitle(e.target.value); setTitleError(false) }}
              className={titleError ? 'border-destructive' : ''}
              autoFocus
            />
            {titleError && <p className="text-xs text-destructive">Required</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              placeholder="Any notes…"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Sub-tasks */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Sub-tasks</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSubTask}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add
              </Button>
            </div>
            {subTasks.length > 0 && (
              <div className="flex flex-col gap-2">
                {subTasks.map((st, i) => (
                  <div key={i} className="flex flex-col gap-1.5 border-l-2 border-border pl-3">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder={`Sub-task ${i + 1}`}
                        value={st.title}
                        onChange={(e) => updateSubTask(i, 'title', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => removeSubTask(i)}
                        aria-label="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Notes (optional)"
                      value={st.notes}
                      onChange={(e) => updateSubTask(i, 'notes', e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
