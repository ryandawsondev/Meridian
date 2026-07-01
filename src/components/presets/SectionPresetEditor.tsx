import { useState } from 'react'
import { Pencil, Trash2, Plus, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import type { SectionPreset } from '../../types'
import type { BlockFormValues } from '../../schemas'
import { validateNoOverlap } from '../../schemas'
import {
  useCreateSectionBlock,
  useUpdateSectionBlock,
  useDeleteSectionBlock,
} from '../../hooks/useSectionBlocks'
import { useUpdateSectionPreset, useSectionPresets } from '../../hooks/useSectionPresets'
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

interface SectionPresetEditorProps {
  preset: SectionPreset
  open: boolean
  onClose: () => void
}

type EditingBlock = { id: string; values: Partial<BlockFormValues> } | null

export default function SectionPresetEditor({ preset: initialPreset, open, onClose }: SectionPresetEditorProps) {
  const { data: allPresets = [] } = useSectionPresets()
  const preset = allPresets.find((p) => p.id === initialPreset.id) ?? initialPreset

  const [name, setName] = useState(initialPreset.name)
  const [nameSaved, setNameSaved] = useState(false)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [editingBlock, setEditingBlock] = useState<EditingBlock>(null)
  const [overlapError, setOverlapError] = useState<string | null>(null)
  const [closeAlertOpen, setCloseAlertOpen] = useState(false)

  const setHasUnsavedChanges = useUiStore((s) => s.setHasUnsavedChanges)

  const updatePreset = useUpdateSectionPreset()
  const createBlock = useCreateSectionBlock()
  const updateBlock = useUpdateSectionBlock()
  const deleteBlock = useDeleteSectionBlock()

  const hasNameChanged = name !== preset.name

  const sortedBlocks = [...preset.blocks].sort((a, b) =>
    a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0
  )

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

  function openEditBlock(block: SectionPreset['blocks'][number]) {
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
        sectionPresetId: preset.id,
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

  const isBlockSubmitting = createBlock.isPending || updateBlock.isPending

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit section preset</DialogTitle>
          </DialogHeader>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="section-preset-name">Name</Label>
            <div className="flex gap-2">
              <Input
                id="section-preset-name"
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
            {sortedBlocks.length === 0 && (
              <p className="rounded-md border border-dashed border-input px-4 py-6 text-center text-sm text-muted-foreground">
                No blocks yet — add one below
              </p>
            )}
            <motion.div className="flex flex-col gap-2" layout>
              <AnimatePresence initial={false}>
                {sortedBlocks.map((block) => (
                  <motion.div
                    key={block.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2 }}
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
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        className="-m-1 flex h-9 w-9 items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => openEditBlock(block)}
                        aria-label="Edit block"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="-m-1 flex h-9 w-9 items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => handleDeleteBlock(block.id)}
                        disabled={deleteBlock.isPending}
                        aria-label="Delete block"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
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
              Section preset name has unsaved changes. Close without saving?
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
