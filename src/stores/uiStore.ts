import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ViewMode = 'day' | 'week' | 'list'

interface UiState {
  viewMode: ViewMode
  hasUnsavedChanges: boolean
  setViewMode: (mode: ViewMode) => void
  setHasUnsavedChanges: (v: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      viewMode: 'week' as ViewMode,
      hasUnsavedChanges: false,
      setViewMode: (viewMode) => set({ viewMode }),
      setHasUnsavedChanges: (hasUnsavedChanges) => set({ hasUnsavedChanges }),
    }),
    {
      name: 'meridian-ui',
      partialize: (state) => ({ viewMode: state.viewMode }),
    }
  )
)
