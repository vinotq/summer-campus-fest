import { create } from 'zustand'

export const usePlayerStore = create((set) => ({
  sessionId: null,
  totalQuestions: 0,
  currentQuestion: null,
  progress: { index: 0, total: 0 },
  status: 'idle', // idle | in_progress | score_toast | finished
  lastResult: null, // { correct, score, elapsedMs }
  finalResult: null,

  setSession: (sessionId, totalQuestions) => set({ sessionId, totalQuestions, status: 'in_progress' }),
  setQuestion: (question, progress) => set({ currentQuestion: question, progress, status: 'in_progress' }),
  showScoreToast: (lastResult) => set({ lastResult, status: 'score_toast' }),
  setFinished: (finalResult) => set({ finalResult, status: 'finished' }),
  reset: () => set({ sessionId: null, totalQuestions: 0, currentQuestion: null, progress: { index: 0, total: 0 }, status: 'idle', lastResult: null, finalResult: null }),
}))
