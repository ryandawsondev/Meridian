import { useState } from 'react'
import { Check } from 'lucide-react'
import type { DayPreset, WeekPreset } from '../../types'
import { useUpdateWeekPreset, useSetWeekPresetDay } from '../../hooks/usePresets'
import { useUiStore } from '../../stores/uiStore'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
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
  const [nameSaved, setNameSaved] = useState(false)
  const [closeAlertOpen, setCloseAlertOpen] = useState(false)
  const [emptyAlertOpen, setEmptyAlertOpen] = useState(false)

  const setHasUnsavedChanges = useUiStore((s) => s.setHasUnsavedChanges)
  const updatePreset = useUpdateWeekPreset()
  const setDay = useSetWeekPresetDay()

  const hasNameChanged = name !== preset.name
  const hasNoDaysAssigned = Object.values(preset.days).filter(Boolean).length === 0

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

  async function handleDayChange(dayOfWeek: Day, value: string) {
    await setDay.mutateAsync({
      weekPresetId: preset.id,
      dayOfWeek,
      dayPresetId: value === '__none__' ? null : value,
    })
  }

  function handleClose() {
    if (hasNameChanged) {
      setCloseAlertOpen(true)
    } else if (hasNoDaysAssigned) {
      setEmptyAlertOpen(true)
    } else {
      setHasUnsavedChanges(false)
      onClose()
    }
  }

  function forceClose() {
    setHasUnsavedChanges(false)
    onClose()
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
            <div className="flex items-center gap-2">
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
              {nameSaved && !hasNameChanged && (
                <span className="flex shrink-0 items-center gap-1 text-xs text-green-600">
                  <Check className="h-3.5 w-3.5" />
                  Saved
                </span>
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
                <Select
                  value={preset.days[day] ?? '__none__'}
                  onValueChange={(v) => handleDayChange(day, v)}
                >
                  <SelectTrigger aria-label={`${day} day preset`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {dayPresets.map((dp) => (
                      <SelectItem key={dp.id} value={dp.id}>
                        {dp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <AlertDialogAction onClick={forceClose}>Close without saving</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* No days assigned warning */}
      <AlertDialog open={emptyAlertOpen} onOpenChange={setEmptyAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>No days assigned</AlertDialogTitle>
            <AlertDialogDescription>
              This week preset has no day presets assigned. It will appear in planning but produce an empty week.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={forceClose}>Close anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
