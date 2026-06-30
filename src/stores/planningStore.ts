import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FilledBlock } from '../types'

export type PlanningStep = 1 | 2 | 3

const SESSION_TTL_MS = 48 * 60 * 60 * 1000 // 48 hours

interface PlanningState {
  step: PlanningStep
  /** null = blank week (no preset), undefined = not yet chosen */
  weekPresetId: string | null | undefined
  /** "YYYY-MM-DD" of Monday, or null if not yet chosen */
  targetWeekStart: string | null
  /** blockId → FilledBlock */
  filledBlocks: Record<string, FilledBlock>
  /** unix timestamp when session was started */
  sessionStartedAt: number | null

  setStep: (step: PlanningStep) => void
  setWeekPresetId: (id: string | null) => void
  setTargetWeekStart: (date: string) => void
  setFilledBlock: (blockId: string, data: FilledBlock) => void
  clearSession: () => void
  checkStaleness: () => boolean
}

export const usePlanningStore = create<PlanningState>()(
  persist(
    (set, get) => ({
      step: 1,
      weekPresetId: undefined,
      targetWeekStart: null,
      filledBlocks: {},
      sessionStartedAt: null,

      setStep: (step) => set({ step }),
      setWeekPresetId: (weekPresetId) =>
        set((s) => ({
          weekPresetId,
          sessionStartedAt: s.sessionStartedAt ?? Date.now(),
        })),
      setTargetWeekStart: (targetWeekStart) => set({ targetWeekStart }),
      setFilledBlock: (blockId, data) =>
        set((s) => ({ filledBlocks: { ...s.filledBlocks, [blockId]: data } })),
      clearSession: () =>
        set({
          step: 1,
          weekPresetId: undefined,
          targetWeekStart: null,
          filledBlocks: {},
          sessionStartedAt: null,
        }),
      checkStaleness: () => {
        const { sessionStartedAt, clearSession } = get()
        if (sessionStartedAt && Date.now() - sessionStartedAt > SESSION_TTL_MS) {
          clearSession()
          return true
        }
        return false
      },
    }),
    {
      name: 'meridian-planning',
      partialize: (state) => ({
        step: state.step,
        weekPresetId: state.weekPresetId,
        targetWeekStart: state.targetWeekStart,
        filledBlocks: state.filledBlocks,
        sessionStartedAt: state.sessionStartedAt,
      }),
    }
  )
)
