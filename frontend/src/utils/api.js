// src/utils/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Offline guard
  if (!navigator.onLine) {
    toast.error('You are offline. Please check your connection.', { id: 'offline' });
    return Promise.reject(new Error('OFFLINE'));
  }
  return config;
});

// Global error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.message === 'OFFLINE') return Promise.reject(err);

    if (err.response?.status === 401) {
      localStorage.removeItem('rp_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    if (err.response?.status === 429) {
      toast.error('Too many requests. Please slow down.', { id: 'ratelimit' });
    }

    if (err.response?.status >= 500) {
      toast.error('Server error. Please try again later.', { id: 'server-error' });
    }

    return Promise.reject(err);
  }
);

export default api;

// Helper to extract error message
export const getError = (err) =>
  err.response?.data?.message || err.message || 'Something went wrong';
