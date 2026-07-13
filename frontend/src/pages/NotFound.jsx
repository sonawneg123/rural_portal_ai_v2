import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="font-display text-8xl font-extrabold text-slate-200 leading-none mb-5 animate-float">
        404
      </motion.div>
      <div className="text-4xl mb-4">🌿</div>
      <h1 className="font-display text-2xl font-extrabold text-ink dark:text-slate-100 tracking-tight mb-2.5">Page not found</h1>
      <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <button onClick={() => navigate(-1)} className="btn btn-ghost"><ArrowLeft className="w-4 h-4" /> Go Back</button>
        <Link to="/"       className="btn btn-navy"><Home className="w-4 h-4" /> Home</Link>
        <Link to="/search" className="btn btn-outline"><Search className="w-4 h-4" /> Search</Link>
      </div>
    </div>
  );
}
