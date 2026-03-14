import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
  counts: {
     unread: 0,
     alerts: 0
  },
  notifications: [],

  addNotification: (payload) => set((state) => ({
      notifications: [payload, ...state.notifications],
      counts: { ...state.counts, unread: state.counts.unread + 1 }
  })),

  clearUnread: () => set((state) => ({
      counts: { ...state.counts, unread: 0 }
  }))
}));
