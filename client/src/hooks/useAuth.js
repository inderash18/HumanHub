import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import * as authService from '../services/authService';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const authStore = useAuthStore();

  const handleLogin = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(credentials);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      authStore.login(data, data.token);
      toast.success('Welcome back to HumanHub');
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
        await authService.logout();
    } catch (e) {
        console.error("Logout sync failed", e);
    } finally {
        api.defaults.headers.common['Authorization'] = null;
        authStore.logout();
        toast('Logged out secure session');
    }
  };

  return { handleLogin, handleLogout, loading, error };
};
