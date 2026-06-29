export interface DbBlock {
  id: string
  day_preset_id: string
  title: string
  start_time: string
  end_time: string
  colour: string
  is_variable: boolean
  notes: string | null
  order: number
}

export interface DbDayPreset {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
  blocks?: DbBlock[]
}

export interface DbWeekPresetDay {
  id: string
  week_preset_id: string
  day_of_week: string
  day_preset_id: string | null
}

export interface DbWeekPreset {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
  week_preset_days?: DbWeekPresetDay[]
}

export interface DbUserSettings {
  user_id: string
  default_week_preset_id: string | null
  preferred_view: string
}

export interface DbPublishedWeek {
  id: string
  user_id: string
  week_start: string
  week_preset_id: string | null
  created_at: string
}

export interface DbPublishedEvent {
  id: string
  published_week_id: string
  google_calendar_event_id: string
  block_id: string | null
  day_date: string
  title: string
  start_time: string
  end_time: string
}
