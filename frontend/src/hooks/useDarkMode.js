// src/hooks/useDarkMode.js — Feature 11: Dark mode
import { useState, useEffect } from 'react';

export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('rp_theme') === 'dark'; } catch { return false; }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('rp_theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
      localStorage.setItem('rp_theme', 'light');
    }
  }, [dark]);

  return [dark, () => setDark(d => !d)];
}
