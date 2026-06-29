import type { Block, DayPreset, WeekPreset, UserSettings } from '../types'
import type { DbBlock, DbDayPreset, DbWeekPreset, DbUserSettings } from '../types/db'

export function mapBlock(db: DbBlock): Block {
  return {
    id: db.id,
    title: db.title,
    startTime: db.start_time,
    endTime: db.end_time,
    colour: db.colour,
    isVariable: db.is_variable,
    notes: db.notes ?? undefined,
  }
}

export function mapDayPreset(db: DbDayPreset): DayPreset {
  return {
    id: db.id,
    name: db.name,
    blocks: (db.blocks ?? []).sort((a, b) => a.order - b.order).map(mapBlock),
  }
}

export function mapWeekPreset(db: DbWeekPreset): WeekPreset {
  const days: WeekPreset['days'] = {}
  for (const day of db.week_preset_days ?? []) {
    if (day.day_preset_id) {
      days[day.day_of_week as keyof WeekPreset['days']] = day.day_preset_id
    }
  }
  return { id: db.id, name: db.name, days }
}

export function mapUserSettings(db: DbUserSettings): UserSettings {
  return {
    userId: db.user_id,
    defaultWeekPresetId: db.default_week_preset_id,
    preferredView: db.preferred_view as UserSettings['preferredView'],
  }
}
