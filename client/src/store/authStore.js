import { create } from "zustand";
import api from "../services/api";

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),

  setAuth: (user, token) => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    if (token) localStorage.setItem('token', token);
    set({
      user,
      token,
      isAuthenticated: !!token
    });
  },

  login: async (identifier, password) => {
    const trimmed = typeof identifier === 'string' ? identifier.trim() : '';
    const res = await api.post('/auth/login', {
      email: trimmed,
      username: trimmed,
      identifier: trimmed,
      password
    });

    if (res.data?.mfaRequired) {
      return { mfaRequired: true, challengeId: res.data.challengeId };
    }

    if (res.data?.token) {
      const user = res.data.user || res.data;
      get().setAuth(user, res.data.token);
      return { success: true, user, token: res.data.token };
    }

    return res.data;
  },

  verifyMfa: async (challengeId, code, isBackupCode = false) => {
    const res = await api.post('/auth/mfa/verify-login', {
      challengeId,
      code: String(code).trim(),
      isBackupCode
    });

    if (res.data?.token) {
      const user = res.data.user || res.data;
      get().setAuth(user, res.data.token);
      return { success: true, user, token: res.data.token };
    }

    return res.data;
  },

  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },

  updateUser: (updatedUser) => {
    set((state) => {
      const merged = { ...state.user, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(merged));
      return { user: merged };
    });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      set({
        user: null,
        token: null,
        isAuthenticated: false
      });
    }
  }
}));

export default useAuthStore;