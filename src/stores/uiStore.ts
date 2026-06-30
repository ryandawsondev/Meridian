import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ViewMode = 'day' | 'week' | 'list'
export type Theme = 'light' | 'dark'

interface UiState {
  viewMode: ViewMode
  theme: Theme
  hasUnsavedChanges: boolean
  setViewMode: (mode: ViewMode) => void
  setTheme: (theme: Theme) => void
  setHasUnsavedChanges: (v: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      viewMode: 'list' as ViewMode,
      theme: 'light' as Theme,
      hasUnsavedChanges: false,
      setViewMode: (viewMode) => set({ viewMode }),
      setTheme: (theme) => set({ theme }),
      setHasUnsavedChanges: (hasUnsavedChanges) => set({ hasUnsavedChanges }),
    }),
    {
      name: 'meridian-ui',
      partialize: (state) => ({ viewMode: state.viewMode, theme: state.theme }),
    }
  )
)
