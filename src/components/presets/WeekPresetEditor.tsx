import { useState } from 'react'
import type { DayPreset, WeekPreset } from '../../types'
import { useUpdateWeekPreset, useSetWeekPresetDay } from '../../hooks/usePresets'
import { useUiStore } from '../../stores/uiStore'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
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

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
type Day = (typeof DAYS)[number]

interface WeekPresetEditorProps {
  preset: WeekPreset
  dayPresets: DayPreset[]
  open: boolean
  onClose: () => void
}

export default function WeekPresetEditor({
  preset,
  dayPresets,
  open,
  onClose,
}: WeekPresetEditorProps) {
  const [name, setName] = useState(preset.name)
  const [closeAlertOpen, setCloseAlertOpen] = useState(false)

  const setHasUnsavedChanges = useUiStore((s) => s.setHasUnsavedChanges)
  const updatePreset = useUpdateWeekPreset()
  const setDay = useSetWeekPresetDay()

  const hasNameChanged = name !== preset.name

  function handleNameChange(v: string) {
    setName(v)
    setHasUnsavedChanges(v !== preset.name)
  }

  async function handleSaveName() {
    await updatePreset.mutateAsync({ id: preset.id, name })
    setHasUnsavedChanges(false)
  }

  async function handleDayChange(dayOfWeek: Day, dayPresetId: string) {
    await setDay.mutateAsync({
      weekPresetId: preset.id,
      dayOfWeek,
      dayPresetId: dayPresetId || null,
    })
  }

  function handleClose() {
    if (hasNameChanged) {
      setCloseAlertOpen(true)
    } else {
      setHasUnsavedChanges(false)
      onClose()
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit week preset</DialogTitle>
          </DialogHeader>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="week-preset-name">Name</Label>
            <div className="flex gap-2">
              <Input
                id="week-preset-name"
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
            </div>
          </div>

          {/* Day grid */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Day assignments</p>
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm capitalize text-muted-foreground">
                  {day}
                </span>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={preset.days[day] ?? ''}
                  onChange={(e) => handleDayChange(day, e.target.value)}
                  aria-label={`${day} day preset`}
                >
                  <option value="">— None —</option>
                  {dayPresets.map((dp) => (
                    <option key={dp.id} value={dp.id}>
                      {dp.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
