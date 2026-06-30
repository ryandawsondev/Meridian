import { useMemo } from 'react'
import { usePlanningStore } from '../stores/planningStore'
import { useWeekPresets, useDayPresets } from './usePresets'
import { useWeekRange } from './useWeekRange'
import { getDayName, formatDayLabel, formatDayShort, toISO } from '../lib/date'
import type { DayName } from '../lib/date'

export type PreviewBlock = {
  blockId: string
  originalTitle: string
  displayTitle: string
  notes?: string
  subTasks?: { title: string; notes?: string }[]
  startTime: string
  endTime: string
  colour: string
  isVariable: boolean
}

export type PreviewDay = {
  dayName: DayName
  date: Date
  dateISO: string
  label: string
  shortLabel: string
  blocks: PreviewBlock[]
}

export function usePlanningPreview(): PreviewDay[] | null {
  const { weekPresetId, targetWeekStart, filledBlocks } = usePlanningStore()
  const { data: weekPresets = [] } = useWeekPresets()
  const { data: dayPresets = [] } = useDayPresets()
  const weekRange = useWeekRange(targetWeekStart)

  return useMemo(() => {
    if (!weekRange) return null

    const weekPreset = weekPresets.find((p) => p.id === weekPresetId)

    return weekRange.dates.map((date) => {
      const dayName = getDayName(date)
      const dayPresetId = weekPreset?.days[dayName]
      const dayPreset = dayPresets.find((dp) => dp.id === dayPresetId)

      const dateISO = toISO(date)
      const blocks: PreviewBlock[] = (dayPreset?.blocks ?? []).map((block) => {
        const filled = filledBlocks[`${dateISO}_${block.id}`]
        return {
          blockId: block.id,
          originalTitle: block.title,
          displayTitle: block.isVariable ? (filled?.title || block.title) : block.title,
          notes: block.isVariable ? filled?.notes : block.notes,
          subTasks: block.isVariable ? filled?.subTasks : undefined,
          startTime: block.startTime,
          endTime: block.endTime,
          colour: block.colour,
          isVariable: block.isVariable,
        }
      })

      return {
        dayName,
        date,
        dateISO,
        label: formatDayLabel(date),
        shortLabel: formatDayShort(date),
        blocks,
      }
    })
  }, [weekRange, weekPresets, dayPresets, filledBlocks, weekPresetId])
}
