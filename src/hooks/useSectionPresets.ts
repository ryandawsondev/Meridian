import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { mapSectionPreset } from '../lib/mappers'
import type { DbSectionPreset } from '../types/db'
import type { SectionPreset } from '../types'
import { dayPresetsKey } from './usePresets'

export const sectionPresetsKey = ['sectionPresets'] as const

export function useSectionPresets() {
  return useQuery({
    queryKey: sectionPresetsKey,
    queryFn: async (): Promise<SectionPreset[]> => {
      const { data, error } = await supabase
        .from('section_presets')
        .select('*, section_preset_blocks(*)')
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return (data as DbSectionPreset[]).map(mapSectionPreset)
    },
  })
}

export function useCreateSectionPreset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (name: string): Promise<SectionPreset> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('section_presets')
        .insert({ name, user_id: user.id })
        .select()
        .single()
      if (error) throw new Error(error.message)
      return mapSectionPreset({ ...(data as DbSectionPreset), section_preset_blocks: [] })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sectionPresetsKey }),
  })
}

export function useUpdateSectionPreset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }): Promise<void> => {
      const { error } = await supabase.from('section_presets').update({ name }).eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sectionPresetsKey }),
  })
}

export function useDeleteSectionPreset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('section_presets').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sectionPresetsKey }),
  })
}

export function useImportSectionToDay() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      dayPresetId,
      sectionPreset,
      startingOrder,
    }: {
      dayPresetId: string
      sectionPreset: SectionPreset
      startingOrder: number
    }): Promise<void> => {
      if (sectionPreset.blocks.length === 0) return
      const { error } = await supabase.from('blocks').insert(
        sectionPreset.blocks.map((b, i) => ({
          day_preset_id: dayPresetId,
          title: b.title,
          start_time: b.startTime,
          end_time: b.endTime,
          colour: b.colour,
          is_variable: b.isVariable,
          notes: b.notes ?? null,
          order: startingOrder + i,
        }))
      )
      if (error) throw new Error(error.message)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dayPresetsKey }),
  })
}
