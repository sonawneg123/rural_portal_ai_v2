import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { IndianRupee, MapPin, Filter, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { governanceApi } from '../api/admin.js';
import { problemsApi } from '../api/problems.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getError } from '../api/client.js';
import { PageSpinner } from '../components/ui/Spinner.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { formatBudget } from '../utils/helpers.js';

const COLORS = ['#0A2540', '#635BFF', '#00D4B2', '#F59E0B', '#EF4444', '#10B981'];

export default function CollectorDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('overview');
  const [selTaluka, setSelTaluka] = useState('');
  const [selVillage, setSelVillage] = useState('');
  const [problems, setProblems] = useState([]);
  const [probLoad, setProbLoad] = useState(false);
  const [allocForm, setAllocForm] = useState({ taluka: '', amount: '' });
  const [allocBusy, setAllocBusy] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['collector-dashboard'], queryFn: () => governanceApi.getCollectorDashboard().then(r => r.data) });

  const filterProblems = async () => {
    setProbLoad(true);
    try {
      const params = { district: user?.district || '' };
      if (selTaluka) params.taluka = selTaluka;
      if (selVillage) params.village = selVillage;
      const { data: d } = await problemsApi.getAll(params);
      setProblems(d.data || []);
    } catch (err) { toast.error(getError(err)); }
    finally { setProbLoad(false); }
  };

  const allocateBudget = async () => {
    if (!allocForm.taluka || !allocForm.amount) { toast.error('Select taluka and enter amount'); return; }
    setAllocBusy(true);
    try {
      await governanceApi.collectorAllocateBudget({ taluka: allocForm.taluka, amount: Number(allocForm.amount) });
      toast.success(`Budget allocated to ${allocForm.taluka}`);
      setAllocForm({ taluka: '', amount: '' });
      queryClient.invalidateQueries({ queryKey: ['collector-dashboard'] });
    } catch (err) { toast.error(getError(err)); }
    finally { setAllocBusy(false); }
  };

  if (isLoading) return <PageSpinner />;
  const d = data?.data || {}; const s = d.summary || {};
  const tabs = ['overview', 'budget', 'issues', 'talukas'];

  return (
    <div>
      <div className="inline-flex items-center gap-1.5 bg-purple/12 border border-purple/25 rounded-full px-3 py-1 text-[11px] font-bold text-purple mb-2">
        🏢 District Collector · {user?.district || 'District'}
      </div>
      <h1 className="font-display text-2xl md:text-3xl font-extrabold text-ink dark:text-slate-100 tracking-tight mb-6">
        {user?.district || 'District'} Control Room
      </h1>

      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-[13px] font-medium capitalize transition-colors ${tab === t ? 'bg-white dark:bg-slate-700 shadow-sm text-purple' : 'text-slate-500'}`}>
            {t === 'budget' ? '💰 Budget' : t === 'issues' ? '📋 Issues' : t === 'talukas' ? '🗺 Talukas' : '📊 Overview'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[{ label: 'Problems', val: s.total_problems || 0, color: '#EF4444', icon: AlertTriangle }, { label: 'Pending', val: s.pending || 0, color: '#F59E0B', icon: TrendingUp }, { label: 'Resolved', val: s.resolved || 0, color: '#10B981', icon: CheckCircle }, { label: 'Budget Left', val: formatBudget(s.budget_remaining || 0), color: '#635BFF', icon: IndianRupee }].map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="card p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${c.color}18` }}><c.icon className="w-4 h-4" style={{ color: c.color }} /></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{c.label}</span>
                </div>
                <div className="font-display text-xl font-extrabold text-ink dark:text-slate-100">{c.val}</div>
              </motion.div>
            ))}
          </div>

          <div className="card p-5 mb-5">
            <div className="text-[15px] font-bold mb-4">Problems by Taluka</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={d.byTaluka || []} barSize={28}>
                <XAxis dataKey="taluka" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {(d.byTaluka || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-5">
            <div className="text-[15px] font-bold mb-4">Highest Priority</div>
            <div className="space-y-2.5">
              {(d.critical || []).slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center gap-3.5 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-extrabold text-sm flex-shrink-0" style={{ background: p.ai_severity_score >= 8 ? '#FEF2F2' : '#FFFBEB', color: p.ai_severity_score >= 8 ? '#EF4444' : '#F59E0B' }}>{p.ai_severity_score || '?'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{p.title}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{p.village}, {p.taluka}</div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
              {!(d.critical || []).length && <EmptyState emoji="✅" title="No critical problems" description="All issues under control" />}
            </div>
          </div>
        </div>
      )}

      {tab === 'budget' && (
        <div>
          <div className="bg-gradient-to-br from-[#2D1B69] to-purple rounded-2xl p-6 text-white mb-6">
            <div className="font-display text-lg font-bold mb-1">Allocate Taluka Budget</div>
            <div className="text-xs text-white/65 mb-5">Received {formatBudget(s.budget_allocated || 0)} · {formatBudget(s.budget_remaining || 0)} remaining</div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
              <select value={allocForm.taluka} onChange={e => setAllocForm(f => ({ ...f, taluka: e.target.value }))} className="py-2.5 px-3 rounded-xl border border-white/20 bg-white/10 text-white text-sm outline-none">
                <option value="" className="text-black">Select taluka…</option>
                {(d.talukas || []).map(t => <option key={t} value={t} className="text-black">{t}</option>)}
              </select>
              <input type="number" value={allocForm.amount} onChange={e => setAllocForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount (₹)" className="py-2.5 px-3 rounded-xl border border-white/20 bg-white/10 text-white text-sm outline-none" />
              <button onClick={allocateBudget} disabled={allocBusy} className="btn btn-teal">Allocate</button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(d.talukaBudgets || []).map(t => (
              <div key={t.taluka} className="card p-4">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">{t.taluka}</div>
                <div className="font-display text-xl font-extrabold text-purple">{formatBudget(t.allocated || 0)}</div>
                <div className="text-xs text-slate-400">{formatBudget(t.used || 0)} used</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'issues' && (
        <div>
          <div className="card p-5 mb-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <select className="input" value={selTaluka} onChange={e => { setSelTaluka(e.target.value); setSelVillage(''); }}>
                <option value="">All talukas</option>
                {(d.talukas || []).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select className="input" value={selVillage} onChange={e => setSelVillage(e.target.value)}>
                <option value="">All villages</option>
                {(d.villages || []).filter(v => !selTaluka || v.taluka === selTaluka).map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
              </select>
              <button onClick={filterProblems} disabled={probLoad} className="btn btn-navy"><Filter className="w-3.5 h-3.5" /> Filter</button>
            </div>
          </div>
          {probLoad ? <PageSpinner /> : problems.length > 0 ? (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[11px] text-slate-400 uppercase"><th className="p-3">Title</th><th className="p-3">Village</th><th className="p-3">Status</th><th className="p-3">Severity</th></tr></thead>
                <tbody>{problems.map(p => (
                  <tr key={p.id} className="border-t border-slate-100 dark:border-slate-700">
                    <td className="p-3 font-semibold max-w-[200px] truncate">{p.title}</td>
                    <td className="p-3 text-xs text-slate-500">{p.village}</td>
                    <td className="p-3"><StatusBadge status={p.status} /></td>
                    <td className="p-3 font-bold">{p.ai_severity_score || '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <EmptyState emoji="🔍" title="Apply filters to explore" description="Select a taluka or village" />}
        </div>
      )}

      {tab === 'talukas' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(d.talukaStats || []).map((t, i) => (
            <motion.div key={t.taluka} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card p-4">
              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2D1B69] to-purple flex items-center justify-center text-white font-display font-extrabold text-sm">{t.taluka?.slice(0, 2).toUpperCase()}</div>
                <div className="font-bold text-[15px]">{t.taluka}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2.5">
                <div className="bg-red-50 rounded-xl p-2 text-center"><div className="font-display text-lg font-extrabold text-red-600">{t.total || 0}</div><div className="text-[9px] text-red-600 font-bold uppercase">Total</div></div>
                <div className="bg-emerald-50 rounded-xl p-2 text-center"><div className="font-display text-lg font-extrabold text-emerald-600">{t.resolved || 0}</div><div className="text-[9px] text-emerald-600 font-bold uppercase">Resolved</div></div>
              </div>
              <div className="text-xs text-slate-400 mb-1.5">{t.villages || 0} villages · Avg severity {t.avg_severity || '—'}</div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#2D1B69] to-purple rounded-full" style={{ width: `${t.total > 0 ? Math.round((t.resolved / t.total) * 100) : 0}%` }} /></div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
