import { create } from 'zustand'

type ViewMode = 'day' | 'week' | 'list'
type LayoutMode = 'grid' | 'tabular'

interface UiState {
  viewMode: ViewMode
  layoutMode: LayoutMode
  hasUnsavedChanges: boolean
  setViewMode: (mode: ViewMode) => void
  setLayoutMode: (mode: LayoutMode) => void
  setHasUnsavedChanges: (v: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  viewMode: 'week',
  layoutMode: 'grid',
  hasUnsavedChanges: false,
  setViewMode: (viewMode) => set({ viewMode }),
  setLayoutMode: (layoutMode) => set({ layoutMode }),
  setHasUnsavedChanges: (hasUnsavedChanges) => set({ hasUnsavedChanges }),
}))
