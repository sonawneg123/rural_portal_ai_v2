import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { TrendingUp, CheckCircle, Camera, Bell, ChevronRight } from 'lucide-react';
import { governanceApi } from '../api/admin.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getError } from '../api/client.js';
import { PageSpinner } from '../components/ui/Spinner.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { formatBudget, timeAgo } from '../utils/helpers.js';

export default function SarpanchDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('overview');
  const [updating, setUpdating] = useState(null);

  const { data, isLoading } = useQuery({ queryKey: ['sarpanch-dashboard'], queryFn: () => governanceApi.getSarpanchDashboard().then(r => r.data) });

  const updateProblemStatus = async (id, status) => {
    setUpdating(id);
    try {
      await governanceApi.sarpanchUpdateStatus(id, { status });
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['sarpanch-dashboard'] });
    } catch (err) { toast.error(getError(err)); }
    finally { setUpdating(null); }
  };

  if (isLoading) return <PageSpinner />;
  const d = data?.data || {}; const s = d.summary || {};
  const pct = s.total_problems > 0 ? Math.round((s.resolved || 0) / s.total_problems * 100) : 0;
  const tabs = ['overview', 'problems', 'budget'];

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-2">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 text-[11px] font-bold text-amber-700 mb-2">
            👤 Sarpanch · {user?.village || 'Village'}
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-ink dark:text-slate-100 tracking-tight mb-1">{user?.village || 'Village'} Gram Panchayat</h1>
          <p className="text-[13px] text-slate-400">{user?.district}, {user?.state}</p>
        </div>
        <div className="text-center">
          <div className="relative w-20 h-20">
            <svg width={80} height={80} className="-rotate-90">
              <circle cx={40} cy={40} r={32} stroke="#F1F5F9" strokeWidth={6} fill="none" />
              <motion.circle cx={40} cy={40} r={32} stroke="#F59E0B" strokeWidth={6} fill="none" strokeDasharray={201} strokeLinecap="round"
                initial={{ strokeDashoffset: 201 }} animate={{ strokeDashoffset: 201 - (pct / 100) * 201 }} transition={{ duration: 1.5 }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-display text-lg font-extrabold text-amber-600">{pct}%</div>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">Issues resolved</div>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit mb-6 mt-4 flex-wrap">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-[13px] font-medium capitalize transition-colors ${tab === t ? 'bg-white dark:bg-slate-700 shadow-sm text-amber-700' : 'text-slate-500'}`}>
            {t === 'budget' ? '💰 Budget' : t === 'problems' ? '📋 Problems' : '📊 Overview'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[{ label: 'Total Issues', val: s.total_problems || 0, color: '#F59E0B', icon: TrendingUp }, { label: 'Pending', val: s.pending || 0, color: '#EF4444', icon: Bell }, { label: 'Resolved', val: s.resolved || 0, color: '#10B981', icon: CheckCircle }, { label: 'Work Updates', val: s.work_updates || 0, color: '#00D4B2', icon: Camera }].map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="card p-4">
                <div className="flex items-center justify-between mb-2.5"><div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${c.color}18` }}><c.icon className="w-4 h-4" style={{ color: c.color }} /></div><span className="text-[10px] font-bold text-slate-400 uppercase">{c.label}</span></div>
                <div className="font-display text-xl font-extrabold">{c.val}</div>
              </motion.div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-amber-600 to-amber-400 rounded-2xl p-5 mb-6 grid grid-cols-3 gap-4 text-white">
            {[{ label: 'Budget received', val: formatBudget(s.budget_allocated || 0) }, { label: 'Spent', val: formatBudget(s.budget_used || 0) }, { label: 'Balance', val: formatBudget((s.budget_allocated || 0) - (s.budget_used || 0)) }].map(b => (
              <div key={b.label} className="text-center"><div className="text-[11px] opacity-75 mb-1">{b.label}</div><div className="font-display text-lg font-extrabold">{b.val}</div></div>
            ))}
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[15px] font-bold">Village Problems</div>
              <Link to="/problems" className="text-xs text-amber-700 font-semibold flex items-center gap-1 no-underline">View all <ChevronRight className="w-3 h-3" /></Link>
            </div>
            <div className="space-y-2.5">
              {(d.recentProblems || []).map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.ai_severity_score >= 8 ? '#EF4444' : p.ai_severity_score >= 5 ? '#F59E0B' : '#10B981' }} />
                  <div className="flex-1 min-w-0"><div className="font-semibold text-[13px] truncate">{p.title}</div><div className="text-[11px] text-slate-400">{timeAgo(p.created_at)} · {p.work_updates_count || 0} work updates</div></div>
                  <StatusBadge status={p.status} />
                  {p.status !== 'resolved' && <button onClick={() => updateProblemStatus(p.id, 'in_progress')} disabled={updating === p.id} className="btn btn-teal btn-sm">Update</button>}
                </div>
              ))}
              {!(d.recentProblems || []).length && <EmptyState emoji="🌿" title="No problems reported yet" description="Encourage citizens to report issues" />}
            </div>
          </div>
        </div>
      )}

      {tab === 'problems' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] text-slate-400 uppercase"><th className="p-3">Title</th><th className="p-3">Category</th><th className="p-3">Reporter</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead>
            <tbody>
              {(d.allProblems || []).map(p => (
                <tr key={p.id} className="border-t border-slate-100 dark:border-slate-700">
                  <td className="p-3 font-semibold max-w-[180px] truncate">{p.title}</td>
                  <td className="p-3 text-xs text-slate-500">{p.category}</td>
                  <td className="p-3 text-xs text-slate-500">{p.reporter_name}</td>
                  <td className="p-3"><StatusBadge status={p.status} /></td>
                  <td className="p-3">
                    <select onChange={e => e.target.value && updateProblemStatus(p.id, e.target.value)} defaultValue="" className="px-2 py-1 rounded-lg border border-slate-300 text-xs outline-none">
                      <option value="" disabled>Change status…</option>
                      <option value="in_review">In Review</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'budget' && (
        <div>
          <div className="bg-gradient-to-br from-amber-600 to-amber-400 rounded-2xl p-6 text-white mb-6">
            <div className="font-display text-lg font-bold mb-1">Panchayat Budget</div>
            <div className="text-[13px] opacity-75 mb-5">Allocated by MLA</div>
            <div className="grid grid-cols-3 gap-4">
              {[{ label: 'Total budget', val: formatBudget(s.budget_allocated || 0) }, { label: 'Spent', val: formatBudget(s.budget_used || 0) }, { label: 'Remaining', val: formatBudget((s.budget_allocated || 0) - (s.budget_used || 0)) }].map(b => (
                <div key={b.label} className="bg-white/10 rounded-xl p-3 text-center"><div className="text-[11px] opacity-75 mb-1">{b.label}</div><div className="font-display text-lg font-extrabold">{b.val}</div></div>
              ))}
            </div>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] text-slate-400 uppercase"><th className="p-3">Problem / Project</th><th className="p-3">Category</th><th className="p-3">Allocated</th><th className="p-3">Status</th></tr></thead>
              <tbody>
                {(d.budgetBreakdown || []).map((b, i) => (
                  <tr key={i} className="border-t border-slate-100 dark:border-slate-700">
                    <td className="p-3 font-semibold">{b.title}</td>
                    <td className="p-3 text-xs text-slate-500">{b.category}</td>
                    <td className="p-3 font-bold text-emerald-600">{formatBudget(b.budget_estimate || 0)}</td>
                    <td className="p-3"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
                {!(d.budgetBreakdown || []).length && <tr><td colSpan={4} className="p-10 text-center text-slate-400">No budget data yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
