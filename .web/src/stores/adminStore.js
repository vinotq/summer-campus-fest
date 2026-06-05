import { create } from 'zustand';
import { io } from 'socket.io-client';
import { api } from '../api/client.js';

let adminSocket = null;

function upsertSession(sessions, next) {
  const index = sessions.findIndex((session) => session.id === next.id);
  if (index === -1) return [next, ...sessions];
  return sessions.map((session, currentIndex) => (currentIndex === index ? { ...session, ...next } : session));
}

export const useAdminStore = create((set, get) => ({
  me: null,
  sessions: [],
  questions: [],
  loading: false,
  error: null,
  socketConnected: false,

  async loadMe() {
    const me = await api.adminMe();
    set({ me });
    return me;
  },

  async loadSessions() {
    const { sessions } = await api.adminSessions();
    set({ sessions });
    return sessions;
  },

  async loadQuestions() {
    const { questions } = await api.adminQuestions();
    set({ questions });
    return questions;
  },

  async bootstrap() {
    set({ loading: true, error: null });
    try {
      await Promise.all([get().loadMe(), get().loadSessions(), get().loadQuestions()]);
      set({ loading: false });
    } catch (error) {
      set({ error, loading: false });
      throw error;
    }
  },

  connectSocket() {
    if (adminSocket) return adminSocket;
    adminSocket = io('/', { auth: { role: 'admin' }, withCredentials: true });

    adminSocket.on('connect', () => {
      set({ socketConnected: true });
      get().loadSessions().catch(() => {});
      get().loadQuestions().catch(() => {});
    });
    adminSocket.on('disconnect', () => set({ socketConnected: false }));
    adminSocket.on('players:snapshot', ({ sessions }) => set({ sessions }));
    adminSocket.on('players:new', ({ session }) => set((state) => ({ sessions: upsertSession(state.sessions, session) })));
    adminSocket.on('players:update', ({ sessionId, progress, totalScore }) => set((state) => ({
      sessions: state.sessions.map((session) => (
        session.id === sessionId ? { ...session, progress, totalScore } : session
      )),
    })));
    adminSocket.on('players:finished', ({ sessionId, totalScore, finishedAt }) => set((state) => ({
      sessions: state.sessions.map((session) => (
        session.id === sessionId ? { ...session, totalScore, finishedAt } : session
      )),
    })));
    adminSocket.on('players:visibility', ({ sessionId, hiddenFromDashboard }) => set((state) => ({
      sessions: state.sessions.map((session) => (
        session.id === sessionId ? { ...session, hiddenFromDashboard } : session
      )),
    })));
    adminSocket.on('questions:changed', () => get().loadQuestions().catch(() => {}));
    return adminSocket;
  },

  disconnectSocket() {
    if (adminSocket) adminSocket.disconnect();
    adminSocket = null;
    set({ socketConnected: false });
  },

  async toggleVisibility(session) {
    await api.adminSetVisibility(session.id, !session.hiddenFromDashboard);
    set((state) => ({
      sessions: state.sessions.map((item) => (
        item.id === session.id ? { ...item, hiddenFromDashboard: !session.hiddenFromDashboard } : item
      )),
    }));
  },

  async toggleQuestion(question) {
    await api.adminToggleQuestion(question.id, !question.active);
    set((state) => ({
      questions: state.questions.map((item) => (
        item.id === question.id ? { ...item, active: !question.active } : item
      )),
    }));
  },

  async saveQuestion(question, patch) {
    const response = await api.adminUpdateQuestion(question.id, patch);
    set((state) => ({
      questions: state.questions.map((item) => (item.id === question.id ? response.question : item)),
    }));
    return response.question;
  },

  async createQuestion(payload) {
    const response = await api.adminCreateQuestion(payload);
    set((state) => ({ questions: [...state.questions, response.question] }));
    return response.question;
  },
}));
