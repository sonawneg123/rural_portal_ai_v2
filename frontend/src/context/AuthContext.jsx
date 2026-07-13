import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.js';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,       setUser]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [notifCount, setNotifCount] = useState(0);
  const queryClient = useQueryClient();

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('rp_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await authApi.getMe();
      setUser(data.user);
    } catch {
      localStorage.removeItem('rp_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password });
    localStorage.setItem('rp_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (formData) => {
    const { data } = await authApi.register(formData);
    localStorage.setItem('rp_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('rp_token');
    setUser(null);
    setNotifCount(0);
    queryClient.clear();
    toast.success('Signed out successfully');
  };

  const refreshUser = () => loadUser();

  const isAdmin     = user?.role === 'admin';
  const isGov       = ['cm','collector','mp','mla','sarpanch','gramsevak'].includes(user?.role);
  const isLoggedIn  = !!user;

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, refreshUser,
      notifCount, setNotifCount,
      isAdmin, isGov, isLoggedIn,
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
