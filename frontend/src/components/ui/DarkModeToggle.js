// src/components/ui/DarkModeToggle.js
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useDarkMode } from '../../hooks/useDarkMode';

export default function DarkModeToggle() {
  const [dark, toggle] = useDarkMode();
  return (
    <button onClick={toggle}
      aria-label="Toggle dark mode"
      style={{
        width: 38, height: 38, borderRadius: 'var(--r-md)',
        background: dark ? 'rgba(56,189,248,0.12)' : 'var(--bg-alt)',
        border: `1px solid ${dark ? 'rgba(56,189,248,0.25)' : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all var(--t-base)',
        color: dark ? '#38BDF8' : 'var(--text-60)',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
      {dark
        ? <Sun size={16} style={{ animation: 'spin 0.4s ease' }}/>
        : <Moon size={16} style={{ animation: 'fadeIn 0.3s ease' }}/>}
    </button>
  );
}
