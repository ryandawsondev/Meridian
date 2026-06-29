import type { z } from 'zod'
import type {
  blockSchema,
  dayPresetSchema,
  weekPresetSchema,
  filledBlockSchema,
} from '../schemas'

export type Block = z.infer<typeof blockSchema>
export type DayPreset = z.infer<typeof dayPresetSchema>
export type WeekPreset = z.infer<typeof weekPresetSchema>
export type FilledBlock = z.infer<typeof filledBlockSchema>
