import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { mapSectionBlock } from '../lib/mappers'
import type { DbSectionPresetBlock } from '../types/db'
import type { Block } from '../types'
import { sectionPresetsKey } from './useSectionPresets'

export interface CreateSectionBlockInput {
  sectionPresetId: string
  title: string
  startTime: string
  endTime: string
  colour: string
  isVariable: boolean
  notes?: string
  order: number
}

export function useCreateSectionBlock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateSectionBlockInput): Promise<Block> => {
      const { data, error } = await supabase
        .from('section_preset_blocks')
        .insert({
          section_preset_id: input.sectionPresetId,
          title: input.title,
          start_time: input.startTime,
          end_time: input.endTime,
          colour: input.colour,
          is_variable: input.isVariable,
          notes: input.notes ?? null,
          order: input.order,
        })
        .select()
        .single()
      if (error) throw new Error(error.message)
      return mapSectionBlock(data as DbSectionPresetBlock)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sectionPresetsKey }),
  })
}

export function useUpdateSectionBlock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Omit<Block, 'id'>> & { id: string }): Promise<void> => {
      const dbUpdates: Record<string, unknown> = {}
      if (updates.title !== undefined) dbUpdates.title = updates.title
      if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime
      if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime
      if (updates.colour !== undefined) dbUpdates.colour = updates.colour
      if (updates.isVariable !== undefined) dbUpdates.is_variable = updates.isVariable
      if ('notes' in updates) dbUpdates.notes = updates.notes ?? null

      const { error } = await supabase.from('section_preset_blocks').update(dbUpdates).eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sectionPresetsKey }),
  })
}

export function useDeleteSectionBlock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('section_preset_blocks').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sectionPresetsKey }),
  })
}

export function useReorderSectionBlocks() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (blocks: Array<{ id: string; order: number }>): Promise<void> => {
      const results = await Promise.all(
        blocks.map(({ id, order }) =>
          supabase.from('section_preset_blocks').update({ order }).eq('id', id)
        )
      )
      const firstError = results.find((r) => r.error)?.error
      if (firstError) throw new Error(firstError.message)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sectionPresetsKey }),
  })
}
