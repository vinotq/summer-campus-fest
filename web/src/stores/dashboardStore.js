import { create } from 'zustand'

export const useDashboardStore = create((set) => ({
  top: [],
  setTop: (top) => set({ top }),
}))
