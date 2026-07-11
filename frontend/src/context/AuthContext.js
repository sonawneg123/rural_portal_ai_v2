// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifCount, setNotifCount] = useState(0);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('rp_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      // Load unread notif count
      const nRes = await api.get('/notifications?unread=true&limit=1');
      setNotifCount(nRes.data.unreadCount || 0);
    } catch {
      localStorage.removeItem('rp_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  // Poll notifications every 60s
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get('/notifications?unread=true&limit=1');
        setNotifCount(data.unreadCount || 0);
      } catch { /* silent */ }
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('rp_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    localStorage.setItem('rp_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('rp_token');
    setUser(null);
    setNotifCount(0);
    toast.success('Logged out successfully');
  };

  const refreshUser = () => loadUser();

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, refreshUser,
      notifCount, setNotifCount,
      isAdmin: user?.role === 'admin',
      isLoggedIn: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
