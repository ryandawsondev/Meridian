import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { mapUserSettings } from '../lib/mappers'
import type { DbUserSettings } from '../types/db'
import type { UserSettings } from '../types'

export const userSettingsKey = ['userSettings'] as const

export function useUserSettings() {
  return useQuery({
    queryKey: userSettingsKey,
    queryFn: async (): Promise<UserSettings | null> => {
      const { data, error } = await supabase.from('user_settings').select('*').maybeSingle()
      if (error) throw new Error(error.message)
      return data ? mapUserSettings(data as DbUserSettings) : null
    },
  })
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (settings: Partial<Omit<UserSettings, 'userId'>>): Promise<void> => {
      const dbSettings: Record<string, unknown> = {}
      if ('defaultWeekPresetId' in settings)
        dbSettings.default_week_preset_id = settings.defaultWeekPresetId
      if ('preferredView' in settings) dbSettings.preferred_view = settings.preferredView

      const { error } = await supabase.from('user_settings').upsert(dbSettings)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userSettingsKey }),
  })
}
