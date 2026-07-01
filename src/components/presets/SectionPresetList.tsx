import { useState } from 'react'
import { Pencil, Trash2, Plus, Scissors } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import {
  useSectionPresets,
  useCreateSectionPreset,
  useDeleteSectionPreset,
} from '../../hooks/useSectionPresets'
import type { SectionPreset } from '../../types'
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
import SectionPresetEditor from './SectionPresetEditor'

export default function SectionPresetList() {
  const { data: presets = [], isLoading, error, refetch } = useSectionPresets()
  const createPreset = useCreateSectionPreset()
  const deletePreset = useDeleteSectionPreset()

  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingPreset, setEditingPreset] = useState<SectionPreset | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleCreate() {
    if (!newName.trim()) return
    const created = await createPreset.mutateAsync(newName.trim())
    setNewName('')
    setCreateOpen(false)
    setEditingPreset(created)
  }

  async function handleDelete() {
    if (!deletingId) return
    await deletePreset.mutateAsync(deletingId)
    setDeletingId(null)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 py-4" aria-label="Loading">
        <span className="sr-only">Loading</span>
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-8 text-center">
        <p className="text-sm text-destructive">Failed to load section presets.</p>
        <button
          onClick={() => void refetch()}
          className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {presets.length === 0
            ? 'No section presets yet'
            : `${presets.length} preset${presets.length !== 1 ? 's' : ''}`}
        </p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New section preset
        </Button>
      </div>

      {presets.length === 0 && (
        <div className="rounded-xl border border-dashed border-input px-6 py-12 text-center">
          <Scissors className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium">No section presets</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create a reusable group of time blocks, then import it into any day preset.
          </p>
        </div>
      )}

      <motion.div className="flex flex-col gap-2">
        <AnimatePresence>
          {presets.map((preset) => (
            <motion.div
              key={preset.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 rounded-lg border border-input bg-card px-4 py-3"
            >
              <div className="min-w-0 flex-1">
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
              <div className="flex shrink-0 gap-0.5">
                <button
                  className="-m-1 flex h-10 w-10 items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => setEditingPreset(preset)}
                  aria-label="Edit section preset"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  className="-m-1 flex h-10 w-10 items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => setDeletingId(preset.id)}
                  aria-label="Delete section preset"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New section preset</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="e.g. Morning Routine"
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
            <AlertDialogTitle>Delete section preset?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the section preset and all its blocks. Day presets that have already
              imported its blocks are not affected. This cannot be undone.
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

      {/* Editor — resolve against live query data so mutations reflect immediately */}
      {editingPreset && (() => {
        const livePreset = presets.find((p) => p.id === editingPreset.id) ?? editingPreset
        return (
          <SectionPresetEditor
            preset={livePreset}
            open
            onClose={() => setEditingPreset(null)}
          />
        )
      })()}
    </div>
  )
}
