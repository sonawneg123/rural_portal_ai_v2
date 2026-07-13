import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bookmark } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLocalStorage } from '../../hooks/useAnimations.js';
import toast from 'react-hot-toast';

export default function BookmarkButton({ problemId, className = '' }) {
  const { user } = useAuth();
  const [ids, setIds] = useLocalStorage('rp_bookmarks', []);
  const saved = ids.includes(problemId);

  const toggle = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { toast.error('Sign in to bookmark problems'); return; }
    setIds(saved ? ids.filter(id => id !== problemId) : [...ids, problemId]);
    toast.success(saved ? 'Bookmark removed' : 'Problem saved to bookmarks');
  };

  return (
    <motion.button onClick={toggle} whileTap={{ scale: 1.3 }}
      aria-label={saved ? 'Remove bookmark' : 'Save problem'}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${saved ? 'bg-purple/12 text-purple' : 'bg-slate-100 text-slate-400'} ${className}`}>
      <Bookmark className="w-[15px] h-[15px]" fill={saved ? 'currentColor' : 'none'} />
    </motion.button>
  );
}
