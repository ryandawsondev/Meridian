import { useState } from 'react'
import { Pencil, Trash2, Plus, Layers } from 'lucide-react'
import {
  useDayPresets,
  useCreateDayPreset,
  useDeleteDayPreset,
} from '../../hooks/usePresets'
import type { DayPreset } from '../../types'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'
import DayPresetEditor from './DayPresetEditor'

export default function DayPresetList() {
  const { data: presets = [], isLoading, error } = useDayPresets()
  const createPreset = useCreateDayPreset()
  const deletePreset = useDeleteDayPreset()

  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingPreset, setEditingPreset] = useState<DayPreset | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleCreate() {
    if (!newName.trim()) return
    await createPreset.mutateAsync(newName.trim())
    setNewName('')
    setCreateOpen(false)
  }

  async function handleDelete() {
    if (!deletingId) return
    await deletePreset.mutateAsync(deletingId)
    setDeletingId(null)
  }

  if (isLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
  }

  if (error) {
    return (
      <p className="py-8 text-center text-sm text-destructive">
        Failed to load presets. Reload the page.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {presets.length === 0 ? 'No day presets yet' : `${presets.length} preset${presets.length !== 1 ? 's' : ''}`}
        </p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New day preset
        </Button>
      </div>

      {presets.length === 0 && (
        <div className="rounded-xl border border-dashed border-input px-6 py-12 text-center">
          <Layers className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium">No day presets</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create a day preset to define a named schedule of time blocks.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {presets.map((preset) => (
          <div
            key={preset.id}
            className="flex items-center gap-3 rounded-lg border border-input bg-card px-4 py-3"
          >
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium">{preset.name}</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">
                  {preset.blocks.length} block{preset.blocks.length !== 1 ? 's' : ''}
                </span>
                {preset.blocks.some((b) => b.isVariable) && (
                  <Badge variant="secondary" className="text-[10px]">
                    has variable blocks
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              {preset.blocks.slice(0, 4).map((b) => (
                <div
                  key={b.id}
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: b.colour }}
                  title={b.title}
                />
              ))}
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setEditingPreset(preset)}
                aria-label="Edit preset"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => setDeletingId(preset.id)}
                aria-label="Delete preset"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New day preset</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="e.g. Work Day (With Travel)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newName.trim() || createPreset.isPending}
            >
              {createPreset.isPending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deletingId} onOpenChange={(o) => { if (!o) setDeletingId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete day preset?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the preset and all its blocks. Any week presets using it will lose
              that day assignment. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Editor */}
      {editingPreset && (
        <DayPresetEditor
          preset={editingPreset}
          open={!!editingPreset}
          onClose={() => setEditingPreset(null)}
        />
      )}
    </div>
  )
}
