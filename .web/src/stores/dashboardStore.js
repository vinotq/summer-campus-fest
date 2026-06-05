import { create } from 'zustand';
import { io } from 'socket.io-client';
import { api } from '../api/client.js';

let dashboardSocket = null;

export const useDashboardStore = create((set, get) => ({
  top: [],
  loading: false,
  socketConnected: false,

  async loadTop() {
    set({ loading: true });
    const { top } = await api.dashboardTop();
    set({ top, loading: false });
    return top;
  },

  connectSocket() {
    if (dashboardSocket) return dashboardSocket;
    dashboardSocket = io('/', { auth: { role: 'dashboard' }, withCredentials: true });
    dashboardSocket.on('connect', () => {
      set({ socketConnected: true });
      get().loadTop().catch(() => {});
    });
    dashboardSocket.on('disconnect', () => set({ socketConnected: false }));
    dashboardSocket.on('top:update', ({ top }) => set({ top }));
    return dashboardSocket;
  },

  disconnectSocket() {
    if (dashboardSocket) dashboardSocket.disconnect();
    dashboardSocket = null;
    set({ socketConnected: false });
  },
}));
