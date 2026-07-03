import { create } from 'zustand';

export const useUIStore = create((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  modalView: null, // "waitlist" | "report" | "auth" | null
  openModal: (view) => set({ modalView: view }),
  closeModal: () => set({ modalView: null }),

  // Theme support
  theme: localStorage.getItem('theme') || 'dark', // Defaulting to dark as standard premium look
  toggleTheme: () => set((state) => {
    const nextTheme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', nextTheme);
    return { theme: nextTheme };
  })
}));
