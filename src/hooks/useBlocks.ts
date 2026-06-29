import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { mapBlock } from '../lib/mappers'
import type { DbBlock } from '../types/db'
import type { Block } from '../types'
import { dayPresetsKey } from './usePresets'

export interface CreateBlockInput {
  dayPresetId: string
  title: string
  startTime: string
  endTime: string
  colour: string
  isVariable: boolean
  notes?: string
  order: number
}

export function useCreateBlock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateBlockInput): Promise<Block> => {
      const { data, error } = await supabase
        .from('blocks')
        .insert({
          day_preset_id: input.dayPresetId,
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
      return mapBlock(data as DbBlock)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dayPresetsKey }),
  })
}

export function useUpdateBlock() {
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

      const { error } = await supabase.from('blocks').update(dbUpdates).eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dayPresetsKey }),
  })
}

export function useDeleteBlock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('blocks').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dayPresetsKey }),
  })
}

export function useReorderBlocks() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (blocks: Array<{ id: string; order: number }>): Promise<void> => {
      const results = await Promise.all(
        blocks.map(({ id, order }) => supabase.from('blocks').update({ order }).eq('id', id))
      )
      const firstError = results.find((r) => r.error)?.error
      if (firstError) throw new Error(firstError.message)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dayPresetsKey }),
  })
}
