import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { IndianRupee, Filter, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { governanceApi } from '../api/admin.js';
import { problemsApi } from '../api/problems.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getError } from '../api/client.js';
import { PageSpinner } from '../components/ui/Spinner.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { formatBudget } from '../utils/helpers.js';

export default function MPDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('overview');
  const [selDist, setSelDist] = useState('');
  const [selTaluka, setSelTaluka] = useState('');
  const [problems, setProblems] = useState([]);
  const [probLoad, setProbLoad] = useState(false);
  const [allocForm, setAllocForm] = useState({ mla: '', amount: '' });
  const [allocBusy, setAllocBusy] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['mp-dashboard'], queryFn: () => governanceApi.getMPDashboard().then(r => r.data) });

  const filterProblems = async () => {
    setProbLoad(true);
    try {
      const params = { state: user?.state || '' };
      if (selDist) params.district = selDist;
      if (selTaluka) params.taluka = selTaluka;
      const { data: d } = await problemsApi.getAll(params);
      setProblems(d.data || []);
    } catch (err) { toast.error(getError(err)); }
    finally { setProbLoad(false); }
  };

  const allocateBudget = async () => {
    if (!allocForm.mla || !allocForm.amount) { toast.error('Select constituency and enter amount'); return; }
    setAllocBusy(true);
    try {
      await governanceApi.mpAllocateBudget({ taluka: allocForm.mla, amount: Number(allocForm.amount) });
      toast.success(`Allocated to ${allocForm.mla}`);
      setAllocForm({ mla: '', amount: '' });
      queryClient.invalidateQueries({ queryKey: ['mp-dashboard'] });
    } catch (err) { toast.error(getError(err)); }
    finally { setAllocBusy(false); }
  };

  if (isLoading) return <PageSpinner />;
  const d = data?.data || {}; const s = d.summary || {};
  const tabs = ['overview', 'budget', 'issues'];

  return (
    <div>
      <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-[11px] font-bold text-blue-700 mb-2">
        🇮🇳 MP · {user?.constituency || user?.district || 'Constituency'}
      </div>
      <h1 className="font-display text-2xl md:text-3xl font-extrabold text-ink dark:text-slate-100 tracking-tight mb-1.5">Parliamentary Constituency</h1>
      <p className="text-[13px] text-slate-400 mb-6">Multi-district overview · Budget allocation to MLA constituencies</p>

      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-[13px] font-medium capitalize transition-colors ${tab === t ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-700' : 'text-slate-500'}`}>
            {t === 'budget' ? '💰 Budget' : t === 'issues' ? '📋 Issues' : '📊 Overview'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[{ label: 'Issues', val: s.total_problems || 0, color: '#EF4444', icon: AlertTriangle }, { label: 'Pending', val: s.pending || 0, color: '#F59E0B', icon: TrendingUp }, { label: 'Resolved', val: s.resolved || 0, color: '#10B981', icon: CheckCircle }, { label: 'Budget Issued', val: formatBudget(s.budget_allocated || 0), color: '#1D4ED8', icon: IndianRupee }].map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="card p-4">
                <div className="flex items-center justify-between mb-2.5"><div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${c.color}18` }}><c.icon className="w-4 h-4" style={{ color: c.color }} /></div><span className="text-[10px] font-bold text-slate-400 uppercase">{c.label}</span></div>
                <div className="font-display text-xl font-extrabold">{c.val}</div>
              </motion.div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(d.byDistrict || []).map((dd, i) => (
              <div key={dd.district} className="card p-4">
                <div className="font-bold text-[15px] mb-3">{dd.district}</div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-red-50 rounded-xl p-2 text-center"><div className="font-display text-lg font-extrabold text-red-600">{dd.count || 0}</div><div className="text-[9px] text-red-600 font-bold uppercase">Issues</div></div>
                  <div className="bg-emerald-50 rounded-xl p-2 text-center"><div className="font-display text-lg font-extrabold text-emerald-600">{dd.resolved || 0}</div><div className="text-[9px] text-emerald-600 font-bold uppercase">Resolved</div></div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-700 to-blue-400 rounded-full" style={{ width: `${dd.count > 0 ? Math.round((dd.resolved / dd.count) * 100) : 0}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'budget' && (
        <div>
          <div className="bg-gradient-to-br from-blue-700 to-blue-400 rounded-2xl p-6 text-white mb-6">
            <div className="font-display text-lg font-bold mb-1">Allocate to MLA Constituency</div>
            <div className="text-xs text-white/70 mb-5">Total budget: {formatBudget(s.budget_allocated || 0)}</div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
              <select value={allocForm.mla} onChange={e => setAllocForm(f => ({ ...f, mla: e.target.value }))} className="py-2.5 px-3 rounded-xl border border-white/20 bg-white/10 text-white text-sm outline-none">
                <option value="" className="text-black">Select constituency…</option>
                {(d.constituencies || []).map(c => <option key={c} value={c} className="text-black">{c}</option>)}
              </select>
              <input type="number" value={allocForm.amount} onChange={e => setAllocForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount (₹)" className="py-2.5 px-3 rounded-xl border border-white/20 bg-white/10 text-white text-sm outline-none" />
              <button onClick={allocateBudget} disabled={allocBusy} className="btn btn-teal">Allocate</button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(d.constituencies || []).map(c => (
              <div key={c} className="card p-4"><div className="text-xs font-bold text-slate-400 uppercase mb-2">{c}</div><div className="text-sm text-slate-400">Budget tracking available</div></div>
            ))}
            {!(d.constituencies || []).length && <EmptyState emoji="🏘️" title="No constituency data" description="Budget allocations will appear here" />}
          </div>
        </div>
      )}

      {tab === 'issues' && (
        <div>
          <div className="card p-5 mb-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <select className="input" value={selDist} onChange={e => { setSelDist(e.target.value); setSelTaluka(''); }}>
                <option value="">All districts</option>
                {(d.districts || []).map(dd => <option key={dd} value={dd}>{dd}</option>)}
              </select>
              <select className="input" value={selTaluka} onChange={e => setSelTaluka(e.target.value)}>
                <option value="">All talukas</option>
                {(d.talukas || []).filter(t => !selDist || t.district === selDist).map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
              </select>
              <button onClick={filterProblems} disabled={probLoad} className="btn btn-navy"><Filter className="w-3.5 h-3.5" /> Filter</button>
            </div>
          </div>
          {probLoad ? <PageSpinner /> : problems.length > 0 ? (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[11px] text-slate-400 uppercase"><th className="p-3">Title</th><th className="p-3">District</th><th className="p-3">Status</th><th className="p-3">Severity</th></tr></thead>
                <tbody>{problems.map(p => (
                  <tr key={p.id} className="border-t border-slate-100 dark:border-slate-700">
                    <td className="p-3 font-semibold max-w-[200px] truncate">{p.title}</td>
                    <td className="p-3 text-xs text-slate-500">{p.district}</td>
                    <td className="p-3"><StatusBadge status={p.status} /></td>
                    <td className="p-3 font-bold">{p.ai_severity_score || '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <EmptyState emoji="🔍" title="Apply filters to explore" description="Select a district or taluka" />}
        </div>
      )}
    </div>
  );
}
