import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { mapDayPreset, mapWeekPreset } from '../lib/mappers'
import type { DbDayPreset, DbWeekPreset } from '../types/db'
import type { DayPreset, WeekPreset } from '../types'

export const dayPresetsKey = ['dayPresets'] as const
export const weekPresetsKey = ['weekPresets'] as const

// ─── Day Presets ────────────────────────────────────────────────────────────

export function useDayPresets() {
  return useQuery({
    queryKey: dayPresetsKey,
    queryFn: async (): Promise<DayPreset[]> => {
      const { data, error } = await supabase
        .from('day_presets')
        .select('*, blocks(*)')
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return (data as DbDayPreset[]).map(mapDayPreset)
    },
  })
}

export function useCreateDayPreset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (name: string): Promise<DayPreset> => {
      const { data, error } = await supabase
        .from('day_presets')
        .insert({ name })
        .select()
        .single()
      if (error) throw new Error(error.message)
      return mapDayPreset({ ...(data as DbDayPreset), blocks: [] })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dayPresetsKey }),
  })
}

export function useUpdateDayPreset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }): Promise<void> => {
      const { error } = await supabase.from('day_presets').update({ name }).eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dayPresetsKey }),
  })
}

export function useDeleteDayPreset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('day_presets').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dayPresetsKey }),
  })
}

// ─── Week Presets ────────────────────────────────────────────────────────────

export function useWeekPresets() {
  return useQuery({
    queryKey: weekPresetsKey,
    queryFn: async (): Promise<WeekPreset[]> => {
      const { data, error } = await supabase
        .from('week_presets')
        .select('*, week_preset_days(*)')
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return (data as DbWeekPreset[]).map(mapWeekPreset)
    },
  })
}

export function useCreateWeekPreset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (name: string): Promise<WeekPreset> => {
      const { data, error } = await supabase
        .from('week_presets')
        .insert({ name })
        .select()
        .single()
      if (error) throw new Error(error.message)
      return mapWeekPreset({ ...(data as DbWeekPreset), week_preset_days: [] })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: weekPresetsKey }),
  })
}

export function useUpdateWeekPreset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }): Promise<void> => {
      const { error } = await supabase.from('week_presets').update({ name }).eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: weekPresetsKey }),
  })
}

export function useDeleteWeekPreset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('week_presets').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: weekPresetsKey }),
  })
}

export function useSetWeekPresetDay() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      weekPresetId,
      dayOfWeek,
      dayPresetId,
    }: {
      weekPresetId: string
      dayOfWeek: string
      dayPresetId: string | null
    }): Promise<void> => {
      if (dayPresetId) {
        const { error } = await supabase.from('week_preset_days').upsert({
          week_preset_id: weekPresetId,
          day_of_week: dayOfWeek,
          day_preset_id: dayPresetId,
        })
        if (error) throw new Error(error.message)
      } else {
        const { error } = await supabase
          .from('week_preset_days')
          .delete()
          .eq('week_preset_id', weekPresetId)
          .eq('day_of_week', dayOfWeek)
        if (error) throw new Error(error.message)
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: weekPresetsKey }),
  })
}
