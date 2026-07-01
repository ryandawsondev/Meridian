import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { blockFormSchema, type BlockFormValues } from '../../schemas'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Switch } from '../ui/switch'
import { Button } from '../ui/button'

export const COLOUR_SWATCHES = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#64748b', '#78716c',
]

interface BlockFormProps {
  defaultValues?: Partial<BlockFormValues>
  onSubmit: (values: BlockFormValues) => void
  onCancel: () => void
  isSubmitting?: boolean
  overlapError?: string | null
}

export default function BlockForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  overlapError,
}: BlockFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<BlockFormValues>({
    resolver: zodResolver(blockFormSchema),
    defaultValues: {
      title: '',
      startTime: '09:00',
      endTime: '10:00',
      colour: '#6366f1',
      isVariable: false,
      notes: '',
      ...defaultValues,
    },
  })

  const isVariable = useWatch({ control, name: 'isVariable' })
  const colour = useWatch({ control, name: 'colour' })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="block-title">Title</Label>
        <Input id="block-title" placeholder="e.g. Morning Routine" {...register('title')} />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="block-start">Start time</Label>
          <Input id="block-start" type="time" {...register('startTime')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="block-end">End time</Label>
          <Input id="block-end" type="time" {...register('endTime')} />
          {errors.endTime && (
            <p className="text-xs text-destructive">{errors.endTime.message}</p>
          )}
        </div>
      </div>

      {overlapError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {overlapError}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="block-colour">Colour</Label>
        {/* Swatch grid */}
        <div className="grid grid-cols-6 gap-2">
          {COLOUR_SWATCHES.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => setValue('colour', hex)}
              aria-label={hex}
              className={`h-8 w-8 rounded-lg transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                colour === hex ? 'ring-2 ring-ring ring-offset-2 scale-110' : ''
              }`}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
        {/* Custom hex input */}
        <div className="flex items-center gap-2">
          <div
            className="h-6 w-6 shrink-0 rounded"
            style={{ backgroundColor: colour }}
          />
          <Input
            id="block-colour"
            className="font-mono text-xs"
            placeholder="#6366f1"
            {...register('colour')}
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border border-input p-3">
        <div>
          <p className="text-sm font-medium">Variable block</p>
          <p className="text-xs text-muted-foreground">Fill in title during planning</p>
        </div>
        <Switch
          checked={isVariable}
          onCheckedChange={(v) => setValue('isVariable', v)}
          aria-label="Variable block"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="block-notes">Notes (optional)</Label>
        <Textarea
          id="block-notes"
          placeholder="Any context for this block…"
          {...register('notes')}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save block'}
        </Button>
      </div>
    </form>
  )
}
