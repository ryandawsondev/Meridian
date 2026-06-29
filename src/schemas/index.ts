import { z } from 'zod'

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

const timeRefinement = (d: { startTime: string; endTime: string }) =>
  timeToMinutes(d.endTime) > timeToMinutes(d.startTime)

const blockBaseSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Required'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Required'),
  colour: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid colour'),
  isVariable: z.boolean(),
  notes: z.string().optional(),
})

export const blockSchema = blockBaseSchema.refine(timeRefinement, {
  message: 'End time must be after start time',
  path: ['endTime'],
})

export const blockFormSchema = blockBaseSchema.omit({ id: true }).refine(timeRefinement, {
  message: 'End time must be after start time',
  path: ['endTime'],
})

export type BlockFormValues = z.infer<typeof blockFormSchema>

export const dayPresetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  blocks: z.array(blockSchema),
})

export const weekPresetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  days: z.object({
    monday: z.string().uuid().optional(),
    tuesday: z.string().uuid().optional(),
    wednesday: z.string().uuid().optional(),
    thursday: z.string().uuid().optional(),
    friday: z.string().uuid().optional(),
    saturday: z.string().uuid().optional(),
    sunday: z.string().uuid().optional(),
  }),
})

export const filledBlockSchema = z.object({
  blockId: z.string().uuid(),
  title: z.string().min(1),
  notes: z.string().optional(),
  subTasks: z
    .array(z.object({ title: z.string().min(1), notes: z.string().optional() }))
    .optional(),
})

export function validateNoOverlap(
  blocks: { startTime: string; endTime: string; title: string }[]
): string | null {
  const sorted = [...blocks].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  )
  for (let i = 0; i < sorted.length - 1; i++) {
    if (timeToMinutes(sorted[i].endTime) > timeToMinutes(sorted[i + 1].startTime)) {
      return `"${sorted[i].title}" overlaps with "${sorted[i + 1].title}"`
    }
  }
  return null
}
