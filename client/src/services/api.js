import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const transport = axios.create({ baseURL: API_URL, withCredentials: true });
const api = axios.create({
  baseURL: API_URL, withCredentials: true, headers: { 'Content-Type': 'application/json' }
});
let refreshing;

export function getRetryAfterSeconds(error, fallback = 15) {
  if (!error || !error.response) return fallback;
  const retryHeader = error.response.headers?.['retry-after'];
  if (retryHeader) {
    const parsedInt = parseInt(retryHeader, 10);
    if (!isNaN(parsedInt) && parsedInt > 0) {
      return Math.min(parsedInt, 300);
    }
    const parsedDate = Date.parse(retryHeader);
    if (!isNaN(parsedDate)) {
      const diffSecs = Math.ceil((parsedDate - Date.now()) / 1000);
      if (diffSecs > 0) return Math.min(diffSecs, 300);
    }
  }
  const bodyRetry = error.response.data?.retryAfter;
  if (typeof bodyRetry === 'number' && bodyRetry > 0) {
    return Math.min(bodyRetry, 300);
  }
  return fallback;
}

export function refreshAccessToken() {
  if (!refreshing) {
    const run = async () => {
      const { data } = await transport.post('/auth/refresh');
      useAuthStore.getState().setAuth(data.user, data.token);
      return data.token;
    };
    // Serialize refresh rotation across tabs when the browser supports Web Locks.
    refreshing = (navigator.locks
      ? navigator.locks.request('humanhub-refresh', run) : run())
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

api.interceptors.response.use(response => response, async error => {
  const config = error.config;
  if (error.response?.status !== 401 || !config || config._retried ||
      /^\/auth\/(login|register|verify-otp|resend-otp|forgot-password|reset-password|logout|refresh)/.test(config.url)) {
    return Promise.reject(error);
  }
  config._retried = true;
  try {
    await refreshAccessToken();
    return api(config);
  } catch (refreshError) {
    if (refreshError.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.assign('/login');
    }
    return Promise.reject(refreshError);
  }
});

export default api;
