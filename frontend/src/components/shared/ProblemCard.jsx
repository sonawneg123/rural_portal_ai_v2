import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ThumbsUp, Eye, Clock, Sparkles, TrendingUp } from 'lucide-react';
import { StatusBadge, SeverityBadge } from '../ui/Badge.jsx';
import BookmarkButton from '../ui/BookmarkButton.jsx';
import { timeAgo, CAT_EMOJI, severityColor } from '../../utils/helpers.js';
import clsx from 'clsx';

export default function ProblemCard({ problem: p, index = 0, visible = true }) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.07, 0.42), ease: [0.34, 1.2, 0.64, 1] }}>
      <Link to={`/problems/${p.id}`}
        className="card card-hover block no-underline group">

        {/* Thumbnail */}
        <div className="relative h-44 overflow-hidden rounded-t-2xl bg-slate-100 dark:bg-slate-700">
          {p.thumbnail && !imgErr ? (
            <img src={p.thumbnail} alt={p.title} onError={() => setImgErr(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              {CAT_EMOJI[p.category] || '📋'}
            </div>
          )}

          {/* Category tag */}
          <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-sm"
            style={{ background: p.category_color || '#0A2540' }}>
            {p.category}
          </span>

          {/* Work logged badge */}
          {p.work_updates_count > 0 && (
            <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold bg-navy/85 text-teal backdrop-blur-sm">
              <TrendingUp className="w-2.5 h-2.5" />
              Work logged
            </span>
          )}

          {/* Upvote overlay */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-semibold">
            <ThumbsUp className="w-3 h-3" />{p.upvotes}
          </div>

          {/* Bookmark */}
          <div className="absolute bottom-2 left-2">
            <BookmarkButton problemId={p.id} className="!bg-black/40 !text-white hover:!bg-black/60" />
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-2.5">
          {/* Status + severity */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={p.status} />
            {p.ai_severity_score && <SeverityBadge score={p.ai_severity_score} />}
          </div>

          {/* Title */}
          <h3 className="font-display font-bold text-[15px] leading-snug text-ink dark:text-slate-100 line-clamp-2 group-hover:text-navy transition-colors">
            {p.title}
          </h3>

          {/* AI summary */}
          {p.ai_summary && (
            <div className="flex gap-1.5 bg-violet-50 dark:bg-violet-950/30 rounded-xl p-2.5 group-hover:translate-x-0.5 transition-transform">
              <Sparkles className="w-3 h-3 text-violet-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-violet-600 dark:text-violet-400 italic leading-relaxed line-clamp-2">
                {p.ai_summary}
              </p>
            </div>
          )}

          {/* Severity heat bar */}
          {p.ai_severity_score && (
            <div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${p.ai_severity_score * 10}%` }}
                  transition={{ duration: 1.1, delay: Math.min(index * 0.07, 0.42) + 0.3, ease: 'easeOut' }}
                  className={clsx(
                    'h-full rounded-full',
                    p.ai_severity_score >= 8
                      ? 'bg-gradient-to-r from-red-500 to-orange-400'
                      : p.ai_severity_score >= 5
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                        : 'bg-gradient-to-r from-navy to-teal'
                  )}
                />
              </div>
            </div>
          )}

          {/* AI tags */}
          {p.ai_tags && (
            <div className="flex gap-1.5 flex-wrap">
              {p.ai_tags.split(',').slice(0, 3).map((t, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                  {t.trim()}
                </span>
              ))}
            </div>
          )}

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{p.village}, {p.district}, {p.state}</span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-navy flex items-center justify-center text-teal text-[9px] font-bold">
                {p.reporter_name?.[0] || '?'}
              </div>
              <span className="text-xs text-slate-400 truncate max-w-[100px]">{p.reporter_name}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1 text-[11px] text-slate-400"><Eye className="w-3 h-3" />{p.views}</span>
              <span className="flex items-center gap-1 text-[11px] text-slate-400"><Clock className="w-3 h-3" />{timeAgo(p.created_at)}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
