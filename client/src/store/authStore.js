import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),

  login: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({
      user,
      token,
      isAuthenticated: true
    });
  },

  setAuth: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({
      user,
      token,
      isAuthenticated: true
    });
  },

  updateUser: (updatedUser) => {
    set((state) => {
      const merged = { ...state.user, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(merged));
      return { user: merged };
    });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({
      user: null,
      token: null,
      isAuthenticated: false
    });
  }
}));

export default useAuthStore;