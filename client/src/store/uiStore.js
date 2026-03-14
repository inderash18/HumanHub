import { create } from 'zustand';

export const useUIStore = create((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  modalView: null, // "waitlist" | "report" | "auth" | null
  openModal: (view) => set({ modalView: view }),
  closeModal: () => set({ modalView: null })
}));
