import axios from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: attach JWT ────────────────────────────────────────
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rp_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    if (!navigator.onLine) {
      toast.error('You are offline. Please check your connection.', { id: 'offline' });
      return Promise.reject(new Error('OFFLINE'));
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response: global error handling ───────────────────────────
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.message === 'OFFLINE') return Promise.reject(err);

    const status  = err.response?.status;
    const message = err.response?.data?.message;

    if (status === 401) {
      localStorage.removeItem('rp_token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(err);
    }

    if (status === 429) {
      toast.error('Too many requests — please slow down.', { id: 'rate-limit' });
    }

    if (status >= 500) {
      toast.error('Server error — please try again later.', { id: 'server-err' });
    }

    return Promise.reject(err);
  }
);

export default client;

export const getError = (err) =>
  err?.response?.data?.message || err?.message || 'Something went wrong';
