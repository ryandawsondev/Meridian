import { z } from 'zod'

export const blockSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  colour: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  isVariable: z.boolean(),
  notes: z.string().optional(),
})

export const dayPresetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  blocks: z.array(blockSchema),
})

export const weekPresetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
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
    .array(
      z.object({
        title: z.string().min(1),
        notes: z.string().optional(),
      })
    )
    .optional(),
})
