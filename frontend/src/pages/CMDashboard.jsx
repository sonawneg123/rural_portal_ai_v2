import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Users, IndianRupee, MapPin, Filter } from 'lucide-react';
import { governanceApi } from '../api/admin.js';
import { problemsApi } from '../api/problems.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getError } from '../api/client.js';
import { PageSpinner } from '../components/ui/Spinner.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { formatBudget } from '../utils/helpers.js';

const COLORS = ['#0A2540', '#635BFF', '#00D4B2', '#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6'];

function StatCard({ label, value, sub, icon: Icon, color, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</span>
      </div>
      <div className="font-display text-2xl font-extrabold text-ink dark:text-slate-100 tracking-tight mb-0.5">{value}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </motion.div>
  );
}

function BudgetAllocator({ districts, onDone }) {
  const [sel, setSel] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!sel || !amount) { toast.error('Select district and enter amount'); return; }
    setBusy(true);
    try {
      await governanceApi.cmAllocateBudget({ district: sel, amount: Number(amount) });
      toast.success(`₹${Number(amount).toLocaleString('en-IN')} allocated to ${sel}`);
      setAmount(''); setSel(''); onDone();
    } catch (err) { toast.error(getError(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="bg-gradient-to-br from-navy to-navy-light rounded-2xl p-6 text-white">
      <div className="flex items-center gap-2.5 mb-5">
        <IndianRupee className="w-5 h-5 text-teal" />
        <div>
          <div className="font-display text-lg font-bold">Allocate District Budget</div>
          <div className="text-xs text-white/60">Funds flow from State → District → Taluka → Village</div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
        <div>
          <label className="text-xs font-semibold text-white/70 block mb-1.5">Select District</label>
          <select value={sel} onChange={e => setSel(e.target.value)} className="w-full py-2.5 px-3 rounded-xl border border-white/20 bg-white/10 text-white text-sm outline-none">
            <option value="" className="text-black">Choose district…</option>
            {districts.map(d => <option key={d} value={d} className="text-black">{d}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-white/70 block mb-1.5">Amount (₹)</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 5000000"
            className="w-full py-2.5 px-3 rounded-xl border border-white/20 bg-white/10 text-white text-sm outline-none" />
        </div>
        <button onClick={submit} disabled={busy} className="btn btn-teal">Allocate</button>
      </div>
    </div>
  );
}

export default function CMDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('overview');
  const [selDist, setSelDist] = useState('');
  const [selTaluka, setSelTaluka] = useState('');
  const [selVillage, setSelVillage] = useState('');
  const [problems, setProblems] = useState([]);
  const [probLoad, setProbLoad] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['cm-dashboard'], queryFn: () => governanceApi.getCMDashboard().then(r => r.data) });

  const filterProblems = async () => {
    if (!selDist) { toast.error('Select at least a district'); return; }
    setProbLoad(true);
    try {
      const params = { state: user?.state || '', district: selDist };
      if (selTaluka) params.taluka = selTaluka;
      if (selVillage) params.village = selVillage;
      const { data: d } = await problemsApi.getAll(params);
      setProblems(d.data || []);
    } catch (err) { toast.error(getError(err)); }
    finally { setProbLoad(false); }
  };

  if (isLoading) return <PageSpinner />;
  const d = data?.data || {};
  const s = d.summary || {};
  const tabs = ['overview', 'budget', 'issues', 'districts'];

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-teal/15 border border-teal/30 rounded-full px-3 py-1 text-[11px] font-bold text-teal mb-2">
            🏛️ Chief Minister Dashboard
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-ink dark:text-slate-100 tracking-tight">{user?.state || 'State'} Overview</h1>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-[13px] font-medium capitalize transition-colors ${tab === t ? 'bg-white dark:bg-slate-700 shadow-sm text-navy' : 'text-slate-500'}`}>
            {t === 'budget' ? '💰 Budget' : t === 'issues' ? '📋 Issues' : t === 'districts' ? '🗺 Districts' : '📊 Overview'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Problems" value={s.total_problems || 0} icon={AlertTriangle} color="#EF4444" delay={0} />
            <StatCard label="Resolved"       value={s.resolved || 0}       icon={CheckCircle}   color="#10B981" delay={0.08} />
            <StatCard label="Citizens"       value={s.total_users || 0}    icon={Users}         color="#0A2540" delay={0.16} />
            <StatCard label="Budget"         value={formatBudget(s.total_budget || 0)} sub="across all districts" icon={IndianRupee} color="#635BFF" delay={0.24} />
          </div>

          <div className="grid lg:grid-cols-[3fr_2fr] gap-5 mb-6">
            <div className="card p-5">
              <div className="text-[15px] font-bold text-ink dark:text-slate-100 mb-4">Problems by Category</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={d.byCategory || []} barSize={24}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {(d.byCategory || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-5">
              <div className="text-[15px] font-bold text-ink dark:text-slate-100 mb-4">District-wise Status</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={d.byDistrict || []} dataKey="count" nameKey="district" cx="50%" cy="50%" outerRadius={75} innerRadius={38} paddingAngle={2}>
                    {(d.byDistrict || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-5">
            <div className="text-[15px] font-bold text-ink dark:text-slate-100 mb-4">Most Urgent — Statewide</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[11px] text-slate-400 uppercase tracking-wide"><th className="pb-2">#</th><th className="pb-2">Problem</th><th className="pb-2">District</th><th className="pb-2">Status</th><th className="pb-2">Severity</th><th className="pb-2">Upvotes</th></tr></thead>
                <tbody>
                  {(d.urgent || []).slice(0, 10).map((p, i) => (
                    <tr key={p.id} className="border-t border-slate-100 dark:border-slate-700">
                      <td className="py-2.5 text-slate-400">{i + 1}</td>
                      <td className="py-2.5 font-semibold max-w-[220px] truncate">{p.title}</td>
                      <td className="py-2.5 text-slate-500 text-xs"><MapPin className="w-3 h-3 inline -mt-0.5" /> {p.district}</td>
                      <td className="py-2.5"><StatusBadge status={p.status} /></td>
                      <td className="py-2.5 font-bold" style={{ color: p.ai_severity_score >= 8 ? '#EF4444' : '#F59E0B' }}>{p.ai_severity_score || '—'}/10</td>
                      <td className="py-2.5 font-semibold text-purple">{p.upvotes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'budget' && (
        <div>
          <BudgetAllocator districts={d.districts || []} onDone={() => queryClient.invalidateQueries({ queryKey: ['cm-dashboard'] })} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            {(d.districtBudgets || []).map(db => (
              <div key={db.district} className="card p-4">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">{db.district}</div>
                <div className="font-display text-xl font-extrabold text-navy mb-1">{formatBudget(db.allocated || 0)}</div>
                <div className="text-xs text-slate-400">{formatBudget(db.used || 0)} used</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'issues' && (
        <div>
          <div className="card p-5 mb-5">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="input-label">District</label>
                <select className="input" value={selDist} onChange={e => { setSelDist(e.target.value); setSelTaluka(''); setSelVillage(''); }}>
                  <option value="">All districts</option>
                  {(d.districts || []).map(dd => <option key={dd} value={dd}>{dd}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Taluka</label>
                <select className="input" value={selTaluka} onChange={e => setSelTaluka(e.target.value)}>
                  <option value="">All talukas</option>
                  {(d.talukas || []).filter(t => !selDist || t.district === selDist).map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Village</label>
                <select className="input" value={selVillage} onChange={e => setSelVillage(e.target.value)}>
                  <option value="">All villages</option>
                  {(d.villages || []).filter(v => !selTaluka || v.taluka === selTaluka).map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                </select>
              </div>
              <button onClick={filterProblems} disabled={probLoad} className="btn btn-navy"><Filter className="w-3.5 h-3.5" /> Apply</button>
            </div>
          </div>
          {probLoad ? <PageSpinner /> : problems.length > 0 ? (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[11px] text-slate-400 uppercase tracking-wide"><th className="p-3">Title</th><th className="p-3">Village</th><th className="p-3">Status</th><th className="p-3">Severity</th><th className="p-3">Upvotes</th></tr></thead>
                <tbody>
                  {problems.map(p => (
                    <tr key={p.id} className="border-t border-slate-100 dark:border-slate-700">
                      <td className="p-3 font-semibold max-w-[220px] truncate">{p.title}</td>
                      <td className="p-3 text-slate-500 text-xs">{p.village}</td>
                      <td className="p-3"><StatusBadge status={p.status} /></td>
                      <td className="p-3 font-bold">{p.ai_severity_score || '—'}</td>
                      <td className="p-3">{p.upvotes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState emoji="🗺️" title="Select filters above to explore" description="Pick a district, taluka or village to see reported problems" />}
        </div>
      )}

      {tab === 'districts' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(d.byDistrict || []).map((dd, i) => (
            <motion.div key={dd.district} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-4">
              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-display font-extrabold text-sm text-navy">
                  {dd.district.slice(0, 2).toUpperCase()}
                </div>
                <div className="font-bold text-[15px] text-ink dark:text-slate-100">{dd.district}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-red-50 rounded-xl p-2.5 text-center"><div className="font-display text-lg font-extrabold text-red-600">{dd.count || 0}</div><div className="text-[9px] text-red-600 font-bold uppercase">Problems</div></div>
                <div className="bg-emerald-50 rounded-xl p-2.5 text-center"><div className="font-display text-lg font-extrabold text-emerald-600">{dd.resolved || 0}</div><div className="text-[9px] text-emerald-600 font-bold uppercase">Resolved</div></div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-navy to-teal rounded-full" style={{ width: `${dd.count > 0 ? Math.round((dd.resolved / dd.count) * 100) : 0}%` }} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
