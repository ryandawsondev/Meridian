import { create } from 'zustand'
import type { FilledBlock } from '../types'

export type PlanningStep = 1 | 2 | 3 | 4

interface PlanningState {
  step: PlanningStep
  /** null = blank week (no preset), undefined = not yet chosen */
  weekPresetId: string | null | undefined
  /** "YYYY-MM-DD" of Monday, or null if not yet chosen */
  targetWeekStart: string | null
  /** blockId → FilledBlock */
  filledBlocks: Record<string, FilledBlock>

  setStep: (step: PlanningStep) => void
  setWeekPresetId: (id: string | null) => void
  setTargetWeekStart: (date: string) => void
  setFilledBlock: (blockId: string, data: FilledBlock) => void
  clearSession: () => void
}

export const usePlanningStore = create<PlanningState>((set) => ({
  step: 1,
  weekPresetId: undefined,
  targetWeekStart: null,
  filledBlocks: {},

  setStep: (step) => set({ step }),
  setWeekPresetId: (weekPresetId) => set({ weekPresetId }),
  setTargetWeekStart: (targetWeekStart) => set({ targetWeekStart }),
  setFilledBlock: (blockId, data) =>
    set((s) => ({ filledBlocks: { ...s.filledBlocks, [blockId]: data } })),
  clearSession: () =>
    set({ step: 1, weekPresetId: undefined, targetWeekStart: null, filledBlocks: {} }),
}))
