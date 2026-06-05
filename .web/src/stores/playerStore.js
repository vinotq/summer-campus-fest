import { create } from 'zustand';
import { api } from '../api/client.js';

export const usePlayerStore = create((set, get) => ({
  current: null,
  result: null,
  loading: false,
  error: null,
  lastScore: null,

  async loadCurrent() {
    set({ loading: true, error: null });
    try {
      const current = await api.currentSession();
      set({
        current,
        result: current.status === 'finished' ? current.result : null,
        loading: false,
      });
      return current;
    } catch (error) {
      set({ error, loading: false });
      throw error;
    }
  },

  async submitAnswer(questionId, answerData) {
    set({ loading: true, error: null });
    try {
      const response = await api.answer({ questionId, answerData });
      set({ lastScore: response, loading: false });
      return response;
    } catch (error) {
      set({ error, loading: false });
      throw error;
    }
  },

  async loadResult() {
    set({ loading: true, error: null });
    try {
      const response = await api.result();
      set({ result: response.result, current: response, loading: false });
      return response.result;
    } catch (error) {
      set({ error, loading: false });
      throw error;
    }
  },

  clearToast() {
    if (get().lastScore) set({ lastScore: null });
  },
}));
