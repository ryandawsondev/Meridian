import { create } from 'zustand'

type ViewMode = 'day' | 'week' | 'list'
type LayoutMode = 'grid' | 'tabular'

interface UiState {
  viewMode: ViewMode
  layoutMode: LayoutMode
  setViewMode: (mode: ViewMode) => void
  setLayoutMode: (mode: LayoutMode) => void
}

export const useUiStore = create<UiState>((set) => ({
  viewMode: 'week',
  layoutMode: 'grid',
  setViewMode: (viewMode) => set({ viewMode }),
  setLayoutMode: (layoutMode) => set({ layoutMode }),
}))
