import { describe, it, expect, beforeEach } from 'vitest'
import { usePlanningStore } from '../../stores/planningStore'
import type { FilledBlock } from '../../types'

beforeEach(() => {
  usePlanningStore.getState().clearSession()
})

describe('planningStore', () => {
  it('starts at step 1 with no selection', () => {
    const state = usePlanningStore.getState()
    expect(state.step).toBe(1)
    expect(state.weekPresetId).toBeUndefined()
    expect(state.targetWeekStart).toBeNull()
    expect(state.filledBlocks).toEqual({})
  })

  it('setStep advances step', () => {
    usePlanningStore.getState().setStep(3)
    expect(usePlanningStore.getState().step).toBe(3)
  })

  it('setWeekPresetId sets preset id', () => {
    usePlanningStore.getState().setWeekPresetId('preset-abc')
    expect(usePlanningStore.getState().weekPresetId).toBe('preset-abc')
  })

  it('setWeekPresetId accepts null for blank week', () => {
    usePlanningStore.getState().setWeekPresetId(null)
    expect(usePlanningStore.getState().weekPresetId).toBeNull()
  })

  it('setTargetWeekStart stores ISO string', () => {
    usePlanningStore.getState().setTargetWeekStart('2025-07-07')
    expect(usePlanningStore.getState().targetWeekStart).toBe('2025-07-07')
  })

  it('setFilledBlock stores filled block by blockId', () => {
    const filled: FilledBlock = {
      blockId: 'block-1',
      title: 'Ukrainian study',
      notes: 'Vocab chapter 3',
    }
    usePlanningStore.getState().setFilledBlock('block-1', filled)
    expect(usePlanningStore.getState().filledBlocks['block-1']).toEqual(filled)
  })

  it('setFilledBlock merges without overwriting others', () => {
    usePlanningStore.getState().setFilledBlock('block-1', { blockId: 'block-1', title: 'A' })
    usePlanningStore.getState().setFilledBlock('block-2', { blockId: 'block-2', title: 'B' })
    const { filledBlocks } = usePlanningStore.getState()
    expect(filledBlocks['block-1'].title).toBe('A')
    expect(filledBlocks['block-2'].title).toBe('B')
  })

  it('clearSession resets all state', () => {
    const store = usePlanningStore.getState()
    store.setStep(3)
    store.setWeekPresetId('x')
    store.setTargetWeekStart('2025-07-07')
    store.setFilledBlock('b1', { blockId: 'b1', title: 'X' })

    store.clearSession()

    const after = usePlanningStore.getState()
    expect(after.step).toBe(1)
    expect(after.weekPresetId).toBeUndefined()
    expect(after.targetWeekStart).toBeNull()
    expect(after.filledBlocks).toEqual({})
  })
})
