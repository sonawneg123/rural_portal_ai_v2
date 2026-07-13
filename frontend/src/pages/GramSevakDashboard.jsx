import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Camera, Sparkles, MapPin, FileText } from 'lucide-react';
import { governanceApi } from '../api/admin.js';
import { PageSpinner } from '../components/ui/Spinner.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { timeAgo } from '../utils/helpers.js';

export default function GramSevakDashboard() {
  const [tab, setTab] = useState('pending');
  const { data, isLoading } = useQuery({ queryKey: ['gramsevak-dashboard'], queryFn: () => governanceApi.getGramSevakDashboard().then(r => r.data) });

  if (isLoading) return <PageSpinner />;
  const d = data?.data || {}; const s = d.summary || {};
  const tabs = ['pending', 'in_progress', 'resolved'];
  const filtered = (d.problems || []).filter(p => p.status === tab);

  return (
    <div>
      <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 text-[11px] font-bold text-emerald-700 mb-2">
        📋 Gram Sevak · Field Operations
      </div>
      <h1 className="font-display text-2xl md:text-3xl font-extrabold text-ink dark:text-slate-100 tracking-tight mb-1.5">Field Operations</h1>
      <p className="text-[13px] text-slate-400 mb-5">Track and verify work progress across all village problems</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[{ label: 'Pending', val: s.pending || 0, color: '#F59E0B', bg: '#FFFBEB' }, { label: 'In Progress', val: s.in_progress || 0, color: '#8B5CF6', bg: '#F5F3FF' }, { label: 'Resolved', val: s.resolved || 0, color: '#10B981', bg: '#ECFDF5' }, { label: 'Work Updates', val: s.work_updates || 0, color: '#0A2540', bg: '#F1F5F9' }].map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="rounded-2xl p-4 text-center" style={{ background: c.bg }}>
            <div className="font-display text-2xl font-extrabold" style={{ color: c.color }}>{c.val}</div>
            <div className="text-[10px] font-bold uppercase tracking-wide mt-1" style={{ color: c.color, opacity: 0.75 }}>{c.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit mb-6">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-[13px] font-medium capitalize transition-colors ${tab === t ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-700' : 'text-slate-500'}`}>
            {t.replace('_', ' ')} ({(d.problems || []).filter(p => p.status === t).length})
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-4">
            <div className="flex items-start gap-3.5 flex-wrap">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-extrabold text-[15px] flex-shrink-0" style={{ background: p.ai_severity_score >= 8 ? '#FEF2F2' : p.ai_severity_score >= 5 ? '#FFFBEB' : '#ECFDF5', color: p.ai_severity_score >= 8 ? '#EF4444' : p.ai_severity_score >= 5 ? '#F59E0B' : '#10B981' }}>
                {p.ai_severity_score || '?'}
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="font-bold text-[15px] mb-1">{p.title}</div>
                <div className="text-xs text-slate-400 flex items-center gap-2.5 flex-wrap">
                  <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{p.village}</span>
                  <span>{p.category}</span>
                  <span>{timeAgo(p.created_at)}</span>
                </div>
                {p.ai_summary && (
                  <div className="mt-2 bg-slate-50 dark:bg-slate-700 rounded-xl p-2.5 flex gap-1.5 text-xs text-slate-500">
                    <Sparkles className="w-3 h-3 text-purple flex-shrink-0 mt-0.5" />
                    <span className="italic">{p.ai_summary.slice(0, 100)}…</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 items-end">
                <StatusBadge status={p.status} />
                <div className="flex gap-2">
                  <Link to={`/problems/${p.id}/work-progress`} className="btn btn-teal btn-sm"><Camera className="w-3 h-3" /> Add Update</Link>
                  <Link to={`/problems/${p.id}`} className="btn btn-ghost btn-sm"><FileText className="w-3 h-3" /> View</Link>
                </div>
              </div>
            </div>
            {p.work_updates_count > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2 text-xs text-slate-500">
                <Camera className="w-3 h-3 text-teal-dark" />{p.work_updates_count} work update{p.work_updates_count !== 1 ? 's' : ''}
                {p.avg_work_completion && <><span className="text-slate-300">·</span><span className="text-emerald-600 font-semibold">~{Math.round(p.avg_work_completion)}% complete</span></>}
              </div>
            )}
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <EmptyState emoji={tab === 'resolved' ? '✅' : '📋'} title={tab === 'resolved' ? 'No resolved problems yet' : 'No problems in this category'}
            description="Problems reported by citizens will appear here" />
        )}
      </div>
    </div>
  );
}
