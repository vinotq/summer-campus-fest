import { create } from 'zustand'

export const useAdminStore = create((set, get) => ({
  sessions: [],
  questions: [],
  connected: false,
  socketStatus: 'disconnected',

  setSessions: (sessions) => set({ sessions }),
  setQuestions: (questions) => set({ questions }),
  setConnected: (connected) => set({ connected }),
  setSocketStatus: (s) => set({ socketStatus: s }),

  upsertSession: (session) => set((state) => {
    const idx = state.sessions.findIndex(s => s.id === session.id)
    if (idx >= 0) {
      const updated = [...state.sessions]
      updated[idx] = { ...updated[idx], ...session }
      return { sessions: updated }
    }
    return { sessions: [session, ...state.sessions] }
  }),

  updateSessionProgress: (sessionId, progress, totalScore) => set((state) => ({
    sessions: state.sessions.map(s =>
      s.id === sessionId ? { ...s, progress, totalScore } : s
    )
  })),

  finishSession: (sessionId, totalScore, finishedAt) => set((state) => ({
    sessions: state.sessions.map(s =>
      s.id === sessionId ? { ...s, totalScore, finishedAt, progress: { ...s.progress, answered: s.progress.total } } : s
    )
  })),

  setSessionVisibility: (sessionId, hidden) => set((state) => ({
    sessions: state.sessions.map(s =>
      s.id === sessionId ? { ...s, hiddenFromDashboard: hidden } : s
    )
  })),
}))
