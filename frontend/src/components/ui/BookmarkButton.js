// src/components/ui/BookmarkButton.js — Feature 15: Problem bookmarks
import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function BookmarkButton({ problemId, style }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [anim,  setAnim]  = useState(false);

  useEffect(() => {
    try {
      const bookmarks = JSON.parse(localStorage.getItem('rp_bookmarks') || '[]');
      setSaved(bookmarks.includes(problemId));
    } catch { setSaved(false); }
  }, [problemId]);

  const toggle = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { toast.error('Sign in to bookmark problems'); return; }
    try {
      const bookmarks = JSON.parse(localStorage.getItem('rp_bookmarks') || '[]');
      const next = saved
        ? bookmarks.filter(id => id !== problemId)
        : [...bookmarks, problemId];
      localStorage.setItem('rp_bookmarks', JSON.stringify(next));
      setSaved(!saved);
      setAnim(true);
      setTimeout(() => setAnim(false), 400);
      toast.success(saved ? 'Bookmark removed' : 'Problem saved to bookmarks');
    } catch { toast.error('Could not save bookmark'); }
  };

  return (
    <button onClick={toggle}
      aria-label={saved ? 'Remove bookmark' : 'Save problem'}
      title={saved ? 'Remove bookmark' : 'Save problem'}
      style={{
        width: 32, height: 32, borderRadius: 'var(--r-md)',
        border: 'none', cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: saved ? 'rgba(99,91,255,0.12)' : 'var(--bg-alt)',
        color: saved ? 'var(--purple)' : 'var(--text-40)',
        transform: anim ? 'scale(1.3)' : 'scale(1)',
        transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        ...style,
      }}>
      <Bookmark size={15} fill={saved ? 'currentColor' : 'none'}/>
    </button>
  );
}
