import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { IndianRupee, MapPin, Filter, TrendingUp, AlertTriangle, CheckCircle, Camera } from 'lucide-react';
import { governanceApi } from '../api/admin.js';
import { problemsApi } from '../api/problems.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getError } from '../api/client.js';
import { PageSpinner } from '../components/ui/Spinner.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { formatBudget } from '../utils/helpers.js';

export default function MLADashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('overview');
  const [selVillage, setSelVillage] = useState('');
  const [problems, setProblems] = useState([]);
  const [probLoad, setProbLoad] = useState(false);
  const [allocForm, setAllocForm] = useState({ village: '', amount: '' });
  const [allocBusy, setAllocBusy] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['mla-dashboard'], queryFn: () => governanceApi.getMLADashboard().then(r => r.data) });

  const loadVillageProblems = async (village) => {
    setSelVillage(village); setProbLoad(true);
    try {
      const { data: d } = await problemsApi.getAll({ taluka: user?.taluka || '', village });
      setProblems(d.data || []);
    } catch (err) { toast.error(getError(err)); }
    finally { setProbLoad(false); }
  };

  const allocateBudget = async () => {
    if (!allocForm.village || !allocForm.amount) { toast.error('Select village and enter amount'); return; }
    setAllocBusy(true);
    try {
      await governanceApi.mlaAllocateBudget({ village: allocForm.village, amount: Number(allocForm.amount) });
      toast.success(`Allocated to ${allocForm.village}`);
      setAllocForm({ village: '', amount: '' });
      queryClient.invalidateQueries({ queryKey: ['mla-dashboard'] });
    } catch (err) { toast.error(getError(err)); }
    finally { setAllocBusy(false); }
  };

  if (isLoading) return <PageSpinner />;
  const d = data?.data || {}; const s = d.summary || {};
  const tabs = ['overview', 'villages', 'budget', 'issues'];

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <div className="inline-flex items-center gap-1.5 bg-teal/15 border border-teal/30 rounded-full px-3 py-1 text-[11px] font-bold text-teal-dark">
          🏘️ MLA · {user?.taluka || user?.district || 'Constituency'}
        </div>
      </div>
      <h1 className="font-display text-2xl md:text-3xl font-extrabold text-ink dark:text-slate-100 tracking-tight mb-1.5">Constituency Dashboard</h1>
      <p className="text-[13px] text-slate-400 mb-6">{d.villages?.length || 0} villages · {s.total_problems || 0} issues tracked</p>

      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-[13px] font-medium capitalize transition-colors ${tab === t ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-dark' : 'text-slate-500'}`}>
            {t === 'budget' ? '💰 Budget' : t === 'villages' ? '🏘 Villages' : t === 'issues' ? '📋 Issues' : '📊 Overview'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[{ label: 'Total Issues', val: s.total_problems || 0, color: '#EF4444', icon: AlertTriangle }, { label: 'Pending', val: s.pending || 0, color: '#F59E0B', icon: TrendingUp }, { label: 'Resolved', val: s.resolved || 0, color: '#10B981', icon: CheckCircle }, { label: 'Work Updates', val: s.work_updates || 0, color: '#00D4B2', icon: Camera }].map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="card p-4">
                <div className="flex items-center justify-between mb-2.5"><div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${c.color}18` }}><c.icon className="w-4 h-4" style={{ color: c.color }} /></div><span className="text-[10px] font-bold text-slate-400 uppercase">{c.label}</span></div>
                <div className="font-display text-xl font-extrabold">{c.val}</div>
              </motion.div>
            ))}
          </div>
          <div className="bg-gradient-to-br from-teal-dark to-teal rounded-2xl p-5 mb-6 flex items-center gap-5 flex-wrap text-navy">
            <IndianRupee className="w-8 h-8 opacity-60" />
            <div>
              <div className="text-xs font-semibold opacity-70 mb-1">Budget received from Collector</div>
              <div className="font-display text-2xl font-extrabold">{formatBudget(s.budget_allocated || 0)}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xs opacity-70">Distributed to villages</div>
              <div className="font-display text-lg font-extrabold">{formatBudget(s.budget_distributed || 0)}</div>
            </div>
          </div>
          <div className="card p-5">
            <div className="text-[15px] font-bold mb-4">Urgent Issues</div>
            {(d.urgent || []).slice(0, 6).map(p => (
              <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-sm flex-shrink-0" style={{ background: p.ai_severity_score >= 8 ? '#FEF2F2' : '#FFFBEB', color: p.ai_severity_score >= 8 ? '#EF4444' : '#F59E0B' }}>{p.ai_severity_score || '?'}</div>
                <div className="flex-1 min-w-0"><div className="font-semibold text-[13px] truncate">{p.title}</div><div className="text-[11px] text-slate-400 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{p.village}</div></div>
                <StatusBadge status={p.status} />
              </div>
            ))}
            {!(d.urgent || []).length && <EmptyState emoji="✅" title="No urgent issues" description="All problems under control" />}
          </div>
        </div>
      )}

      {tab === 'villages' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {(d.villages || []).map((v, i) => (
            <motion.div key={v.name} onClick={() => { setSelVillage(v.name); loadVillageProblems(v.name); setTab('issues'); }}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`card p-4 cursor-pointer hover:-translate-y-0.5 ${selVillage === v.name ? 'ring-2 ring-teal' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="font-bold text-[15px]">{v.name}</div>
                <span className="text-[10px] font-bold text-teal-dark bg-teal/10 px-2 py-0.5 rounded-full">{v.population || '—'} pop.</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {[{ label: 'Issues', val: v.problems || 0, color: 'text-red-600' }, { label: 'Resolved', val: v.resolved || 0, color: 'text-emerald-600' }, { label: 'Updates', val: v.work_updates || 0, color: 'text-teal-dark' }].map(s => (
                  <div key={s.label} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-1.5 text-center">
                    <div className={`font-display text-sm font-extrabold ${s.color}`}>{s.val}</div>
                    <div className="text-[8px] text-slate-400 font-bold uppercase">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-teal-dark to-teal rounded-full" style={{ width: `${v.problems > 0 ? Math.round((v.resolved / v.problems) * 100) : 0}%` }} /></div>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'budget' && (
        <div>
          <div className="bg-gradient-to-br from-teal-dark to-teal rounded-2xl p-6 text-navy mb-6">
            <div className="font-display text-lg font-bold mb-1">Allocate Village Budget</div>
            <div className="text-xs opacity-75 mb-5">Received: {formatBudget(s.budget_allocated || 0)} · Available: {formatBudget((s.budget_allocated || 0) - (s.budget_distributed || 0))}</div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
              <select value={allocForm.village} onChange={e => setAllocForm(f => ({ ...f, village: e.target.value }))} className="py-2.5 px-3 rounded-xl border border-navy/20 bg-white/50 text-navy text-sm outline-none">
                <option value="">Select village…</option>
                {(d.villages || []).map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
              </select>
              <input type="number" value={allocForm.amount} onChange={e => setAllocForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount (₹)" className="py-2.5 px-3 rounded-xl border border-navy/20 bg-white/50 text-navy text-sm outline-none" />
              <button onClick={allocateBudget} disabled={allocBusy} className="btn btn-navy">Allocate</button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(d.villageBudgets || []).map(v => (
              <div key={v.village} className="card p-4"><div className="text-xs font-bold text-slate-400 uppercase mb-2">{v.village}</div><div className="font-display text-xl font-extrabold text-teal-dark">{formatBudget(v.allocated || 0)}</div><div className="text-xs text-slate-400">{formatBudget(v.used || 0)} used</div></div>
            ))}
            {!(d.villageBudgets || []).length && <EmptyState emoji="💰" title="No budget allocated yet" description="Use the form above" />}
          </div>
        </div>
      )}

      {tab === 'issues' && (
        <div>
          <div className="card p-5 mb-5">
            <div className="flex items-end gap-3.5 flex-wrap">
              <div className="flex-1 min-w-[180px]">
                <label className="input-label">Select Village</label>
                <select className="input" value={selVillage} onChange={e => loadVillageProblems(e.target.value)}>
                  <option value="">All villages</option>
                  {(d.villages || []).map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                </select>
              </div>
              <button onClick={() => selVillage && loadVillageProblems(selVillage)} disabled={probLoad} className="btn btn-navy"><Filter className="w-3.5 h-3.5" /> Load</button>
            </div>
          </div>
          {probLoad ? <PageSpinner /> : problems.length > 0 ? (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[11px] text-slate-400 uppercase"><th className="p-3">Title</th><th className="p-3">Category</th><th className="p-3">Status</th><th className="p-3">Severity</th></tr></thead>
                <tbody>{problems.map(p => (
                  <tr key={p.id} className="border-t border-slate-100 dark:border-slate-700">
                    <td className="p-3 font-semibold max-w-[200px] truncate">{p.title}</td>
                    <td className="p-3 text-xs text-slate-500">{p.category}</td>
                    <td className="p-3"><StatusBadge status={p.status} /></td>
                    <td className="p-3 font-bold">{p.ai_severity_score || '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <EmptyState emoji="🏘️" title="Select a village" description="Click a village or use the dropdown above" />}
        </div>
      )}
    </div>
  );
}
