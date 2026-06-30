import { useState } from 'react'
import { ChevronUp, ChevronDown, Pencil, Trash2, Plus, Check } from 'lucide-react'
import type { DayPreset } from '../../types'
import type { BlockFormValues } from '../../schemas'
import { validateNoOverlap } from '../../schemas'
import { useCreateBlock, useUpdateBlock, useDeleteBlock, useReorderBlocks } from '../../hooks/useBlocks'
import { useUpdateDayPreset } from '../../hooks/usePresets'
import { useUiStore } from '../../stores/uiStore'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
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
import BlockForm from './BlockForm'

interface DayPresetEditorProps {
  preset: DayPreset
  open: boolean
  onClose: () => void
}

type EditingBlock = { id: string; values: Partial<BlockFormValues> } | null

export default function DayPresetEditor({ preset, open, onClose }: DayPresetEditorProps) {
  const [name, setName] = useState(preset.name)
  const [nameSaved, setNameSaved] = useState(false)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [editingBlock, setEditingBlock] = useState<EditingBlock>(null)
  const [overlapError, setOverlapError] = useState<string | null>(null)
  const [closeAlertOpen, setCloseAlertOpen] = useState(false)

  const setHasUnsavedChanges = useUiStore((s) => s.setHasUnsavedChanges)

  const updatePreset = useUpdateDayPreset()
  const createBlock = useCreateBlock()
  const updateBlock = useUpdateBlock()
  const deleteBlock = useDeleteBlock()
  const reorderBlocks = useReorderBlocks()

  const hasNameChanged = name !== preset.name

  function handleNameChange(v: string) {
    setName(v)
    setNameSaved(false)
    setHasUnsavedChanges(v !== preset.name)
  }

  async function handleSaveName() {
    await updatePreset.mutateAsync({ id: preset.id, name })
    setHasUnsavedChanges(false)
    setNameSaved(true)
    setTimeout(() => setNameSaved(false), 2000)
  }

  function handleClose() {
    if (hasNameChanged) {
      setCloseAlertOpen(true)
    } else {
      setHasUnsavedChanges(false)
      onClose()
    }
  }

  function openAddBlock() {
    setEditingBlock(null)
    setOverlapError(null)
    setBlockDialogOpen(true)
  }

  function openEditBlock(block: DayPreset['blocks'][number]) {
    setEditingBlock({
      id: block.id,
      values: {
        title: block.title,
        startTime: block.startTime,
        endTime: block.endTime,
        colour: block.colour,
        isVariable: block.isVariable,
        notes: block.notes ?? '',
      },
    })
    setOverlapError(null)
    setBlockDialogOpen(true)
  }

  async function handleBlockSubmit(values: BlockFormValues) {
    const otherBlocks = preset.blocks.filter((b) => b.id !== editingBlock?.id)
    const overlapMsg = validateNoOverlap([...otherBlocks, { ...values, title: values.title }])
    if (overlapMsg) {
      setOverlapError(overlapMsg)
      return
    }

    if (editingBlock) {
      await updateBlock.mutateAsync({ id: editingBlock.id, ...values })
    } else {
      await createBlock.mutateAsync({
        dayPresetId: preset.id,
        order: preset.blocks.length,
        ...values,
      })
    }
    setBlockDialogOpen(false)
    setOverlapError(null)
  }

  async function handleDeleteBlock(id: string) {
    await deleteBlock.mutateAsync(id)
  }

  async function handleMoveBlock(index: number, direction: 'up' | 'down') {
    const blocks = [...preset.blocks]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= blocks.length) return

    const reordered = blocks.map((b, i) => {
      if (i === index) return { id: b.id, order: blocks[swapIndex].id === b.id ? i : swapIndex }
      if (i === swapIndex) return { id: b.id, order: index }
      return { id: b.id, order: i }
    })
    await reorderBlocks.mutateAsync(reordered)
  }

  const isBlockSubmitting = createBlock.isPending || updateBlock.isPending

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit day preset</DialogTitle>
          </DialogHeader>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="preset-name">Name</Label>
            <div className="flex gap-2">
              <Input
                id="preset-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
              {hasNameChanged && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveName}
                  disabled={updatePreset.isPending}
                >
                  Save
                </Button>
              )}
              {nameSaved && !hasNameChanged && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <Check className="h-3.5 w-3.5" />
                  Saved
                </span>
              )}
            </div>
          </div>

          {/* Blocks */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Blocks</p>
            {preset.blocks.length === 0 && (
              <p className="rounded-md border border-dashed border-input px-4 py-6 text-center text-sm text-muted-foreground">
                No blocks yet — add one below
              </p>
            )}
            {preset.blocks.map((block, i) => (
              <div
                key={block.id}
                className="flex items-center gap-3 rounded-md border border-input p-3"
              >
                <div
                  className="h-8 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: block.colour }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{block.title}</span>
                    {block.isVariable && (
                      <Badge variant="secondary" className="shrink-0">
                        variable
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {block.startTime} – {block.endTime}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleMoveBlock(i, 'up')}
                    disabled={i === 0}
                    aria-label="Move up"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleMoveBlock(i, 'down')}
                    disabled={i === preset.blocks.length - 1}
                    aria-label="Move down"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openEditBlock(block)}
                    aria-label="Edit block"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteBlock(block.id)}
                    disabled={deleteBlock.isPending}
                    aria-label="Delete block"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={openAddBlock}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add block
            </Button>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block add/edit dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={(o) => { if (!o) setBlockDialogOpen(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBlock ? 'Edit block' : 'Add block'}</DialogTitle>
          </DialogHeader>
          <BlockForm
            defaultValues={editingBlock?.values}
            onSubmit={handleBlockSubmit}
            onCancel={() => setBlockDialogOpen(false)}
            isSubmitting={isBlockSubmitting}
            overlapError={overlapError}
          />
        </DialogContent>
      </Dialog>

      {/* Unsaved name changes alert */}
      <AlertDialog open={closeAlertOpen} onOpenChange={setCloseAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              Preset name has unsaved changes. Close without saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setHasUnsavedChanges(false)
                onClose()
              }}
            >
              Close without saving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
