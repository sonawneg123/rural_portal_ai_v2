import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { timeAgo } from '../../utils/helpers.js';

export function CommentCard({ comment, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className={`rounded-xl p-3.5 ${comment.is_official ? 'bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200' : 'bg-slate-50 dark:bg-slate-800'}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${comment.is_official ? 'bg-blue-600 text-white' : 'bg-navy text-teal'}`}>
          {comment.is_official ? <Shield className="w-3.5 h-3.5" /> : comment.author?.[0] || '?'}
        </div>
        <div>
          <div className={`text-xs font-bold ${comment.is_official ? 'text-blue-700' : 'text-ink dark:text-slate-200'}`}>
            {comment.is_official ? '🏛️ Official Response' : comment.author}
          </div>
          <div className="text-[10px] text-slate-400">{timeAgo(comment.created_at)}</div>
        </div>
      </div>
      <p className="text-sm text-ink dark:text-slate-300 leading-relaxed">{comment.content}</p>
    </motion.div>
  );
}

const TYPE_ICON = {
  status_change: '✅', comment: '💬', work_update: '📸', upvote: '👍', system: '✦',
};
const TYPE_COLOR = {
  status_change: 'bg-emerald-50 text-emerald-600',
  comment:       'bg-blue-50 text-blue-600',
  work_update:   'bg-violet-50 text-violet-600',
  upvote:        'bg-amber-50 text-amber-600',
  system:        'bg-slate-100 text-slate-600',
};

export function NotificationCard({ notification: n, onClick, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      onClick={onClick}
      className={`flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
        n.is_read
          ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          : 'bg-teal/5 border-teal/30 shadow-sm'
      }`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base ${TYPE_COLOR[n.type] || TYPE_COLOR.system}`}>
        {TYPE_ICON[n.type] || '🔔'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className={`text-sm ${n.is_read ? 'font-medium' : 'font-bold'} text-ink dark:text-slate-100`}>{n.title}</span>
          {!n.is_read && <div className="w-2 h-2 rounded-full bg-teal flex-shrink-0 animate-pulse-dot" />}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-1.5">{n.message}</p>
        <span className="text-[11px] text-slate-400">{timeAgo(n.created_at)}</span>
      </div>
    </motion.div>
  );
}
