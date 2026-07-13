import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Users, CheckCircle, Clock, TrendingUp, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import { adminApi } from '../api/admin.js';
import { getError } from '../api/client.js';
import { PageSpinner } from '../components/ui/Spinner.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import { ExportButton } from '../components/shared/DeadlineBadge.jsx';
import { STATUS_CONFIG, PRIORITY_CONFIG, formatDate } from '../utils/helpers.js';

const COLORS = ['#0A2540', '#635BFF', '#00D4B2', '#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6'];

function StatCard({ label, value, icon: Icon, color, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="card p-5 text-center">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: `${color}15` }}>
        <Icon className="w-[22px] h-[22px]" style={{ color }} />
      </div>
      <div className="font-display text-2xl font-extrabold text-ink dark:text-slate-100">{value}</div>
      <div className="text-xs text-slate-400 font-medium mt-1">{label}</div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('Overview');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalProblem, setModalProblem] = useState(null);
  const [mForm, setMForm] = useState({ status: '', priority: '', admin_notes: '' });
  const [insights, setInsights] = useState({});
  const [insightLoads, setInsightLoads] = useState({});

  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ['admin-dashboard'], queryFn: () => adminApi.getDashboard().then(r => r.data.data), enabled: tab === 'Overview',
  });
  const { data: problemsData, isLoading: probLoading } = useQuery({
    queryKey: ['admin-problems', statusFilter], queryFn: () => adminApi.getProblems({ limit: 50, status: statusFilter || undefined }).then(r => r.data.data),
    enabled: tab === 'Problems',
  });
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'], queryFn: () => adminApi.getUsers({ limit: 50 }).then(r => r.data.data), enabled: tab === 'Users',
  });

  const problems = (problemsData || []).filter(p => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const users    = usersData || [];

  const openModal = (p) => { setMForm({ status: p.status, priority: p.priority, admin_notes: '' }); setModalProblem(p); };

  const saveStatus = async () => {
    try {
      await adminApi.updateStatus(modalProblem.id, mForm);
      toast.success('Problem updated ✅');
      setModalProblem(null);
      queryClient.invalidateQueries({ queryKey: ['admin-problems'] });
    } catch (err) { toast.error(getError(err)); }
  };

  const toggleUser = async (id) => {
    await adminApi.toggleUser(id);
    toast.success('User status changed');
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  const fetchInsight = async (pid) => {
    setInsightLoads(p => ({ ...p, [pid]: true }));
    try {
      const { data } = await adminApi.getInsight(pid);
      setInsights(p => ({ ...p, [pid]: data.insight }));
    } catch { toast.error('Could not load AI insight'); }
    finally { setInsightLoads(p => ({ ...p, [pid]: false })); }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-ink dark:text-slate-100 tracking-tight mb-6">Admin Dashboard</h1>

      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit mb-6 flex-wrap">
        {['Overview', 'Problems', 'Users'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${tab === t ? 'bg-white dark:bg-slate-700 shadow-sm text-navy' : 'text-slate-500'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Overview' && (dashLoading ? <PageSpinner /> : dashData && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
            <StatCard label="Total Reports"  value={dashData.summary.total_problems} icon={FileText}     color="#3B82F6" delay={0} />
            <StatCard label="Pending"        value={dashData.summary.pending}        icon={Clock}        color="#F59E0B" delay={0.06} />
            <StatCard label="In Progress"    value={dashData.summary.in_progress}    icon={TrendingUp}   color="#8B5CF6" delay={0.12} />
            <StatCard label="Resolved"       value={dashData.summary.resolved}       icon={CheckCircle}  color="#10B981" delay={0.18} />
            <StatCard label="Citizens"       value={dashData.summary.total_users}    icon={Users}        color="#EC4899" delay={0.24} />
            <StatCard label="Today"          value={dashData.summary.today_reports}  icon={AlertTriangle} color="#EF4444" delay={0.3} />
          </div>

          <div className="grid lg:grid-cols-[3fr_2fr] gap-5 mb-6">
            <div className="card p-5">
              <div className="text-[15px] font-bold mb-4">Problems by Category</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dashData.byCategory} barSize={28}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-22} textAnchor="end" height={52} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>{dashData.byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-5">
              <div className="text-[15px] font-bold mb-4">Top States</div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={dashData.byState} dataKey="count" nameKey="state" cx="50%" cy="50%" outerRadius={75} innerRadius={35} paddingAngle={2}>
                    {dashData.byState.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <div className="text-[15px] font-bold">Recent Reports</div>
              <button onClick={() => setTab('Problems')} className="text-xs font-semibold text-navy">View all →</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[10px] text-slate-400 uppercase bg-slate-50 dark:bg-slate-700"><th className="p-3">Title</th><th className="p-3">Category</th><th className="p-3">Status</th><th className="p-3">Priority</th><th className="p-3">Upvotes</th><th className="p-3">Date</th></tr></thead>
                <tbody>
                  {dashData.recentProblems?.map(p => (
                    <tr key={p.id} className="border-t border-slate-100 dark:border-slate-700">
                      <td className="p-3 font-semibold max-w-[200px] truncate"><Link to={`/problems/${p.id}`} className="no-underline text-ink dark:text-slate-100">{p.title}</Link></td>
                      <td className="p-3 text-slate-500">{p.category}</td>
                      <td className="p-3"><StatusBadge status={p.status} /></td>
                      <td className="p-3 font-semibold" style={{ color: PRIORITY_CONFIG[p.priority]?.color?.replace('text-', '') }}>{PRIORITY_CONFIG[p.priority]?.label}</td>
                      <td className="p-3">{p.upvotes}</td>
                      <td className="p-3 text-slate-400 text-xs">{formatDate(p.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}

      {tab === 'Problems' && (
        <div>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div className="flex gap-2.5 flex-wrap">
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search problems…" className="input w-56" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-40">
                <option value="">All statuses</option>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <ExportButton filters={{ status: statusFilter }} />
          </div>

          {probLoading ? <PageSpinner /> : problems.length === 0 ? (
            <div className="card p-10 text-center text-slate-400">No problems found</div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[10px] text-slate-400 uppercase bg-slate-50 dark:bg-slate-700"><th className="p-3">#</th><th className="p-3">Title</th><th className="p-3">Location</th><th className="p-3">Status</th><th className="p-3">Severity</th><th className="p-3">AI Summary</th><th className="p-3">Insight</th><th className="p-3">Action</th></tr></thead>
                <tbody>
                  {problems.map(p => (
                    <tr key={p.id} className="border-t border-slate-100 dark:border-slate-700">
                      <td className="p-3 text-slate-400">{p.id}</td>
                      <td className="p-3 font-semibold max-w-[160px] truncate"><Link to={`/problems/${p.id}`} className="no-underline text-ink dark:text-slate-100">{p.title}</Link></td>
                      <td className="p-3 text-xs text-slate-500">{p.district}, {p.state}</td>
                      <td className="p-3"><StatusBadge status={p.status} /></td>
                      <td className="p-3 text-center font-extrabold" style={{ color: p.ai_severity_score >= 8 ? '#EF4444' : p.ai_severity_score >= 5 ? '#F59E0B' : '#10B981' }}>{p.ai_severity_score || '—'}</td>
                      <td className="p-3 max-w-[180px]">{p.ai_summary && <span className="text-[11px] text-purple italic line-clamp-2">✦ {p.ai_summary}</span>}</td>
                      <td className="p-3">
                        {insights[p.id] ? (
                          <span className="text-[11px] text-amber-700 line-clamp-2 max-w-[160px] block">💡 {insights[p.id]}</span>
                        ) : (
                          <button onClick={() => fetchInsight(p.id)} disabled={insightLoads[p.id]} className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-[10px] font-bold text-amber-700">
                            {insightLoads[p.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Sparkles className="w-2.5 h-2.5" /> Ask Groq</>}
                          </button>
                        )}
                      </td>
                      <td className="p-3"><button onClick={() => openModal(p)} className="btn btn-ghost btn-sm">Update</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'Users' && (usersLoading ? <PageSpinner /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[10px] text-slate-400 uppercase bg-slate-50 dark:bg-slate-700"><th className="p-3">Citizen</th><th className="p-3">Email</th><th className="p-3">Location</th><th className="p-3">Reports</th><th className="p-3">Joined</th><th className="p-3">Status</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t border-slate-100 dark:border-slate-700">
                  <td className="p-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-navy text-teal flex items-center justify-center text-xs font-bold">{u.name[0]}</div><span className="font-semibold">{u.name}</span></div></td>
                  <td className="p-3 text-slate-500">{u.email}</td>
                  <td className="p-3 text-xs text-slate-500">{u.district}, {u.state}</td>
                  <td className="p-3 text-center font-bold">{u.problems_count}</td>
                  <td className="p-3 text-xs text-slate-400">{formatDate(u.created_at)}</td>
                  <td className="p-3"><button onClick={() => toggleUser(u.id)} className={`px-3 py-1 rounded-lg text-xs font-bold ${u.is_active ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{u.is_active ? 'Deactivate' : 'Activate'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <Modal open={!!modalProblem} onClose={() => setModalProblem(null)} title="Update Problem">
        {modalProblem && (
          <div>
            <p className="text-sm text-slate-500 mb-5">{modalProblem.title}</p>
            <label className="input-label">Status</label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <button key={k} onClick={() => setMForm(f => ({ ...f, status: k }))}
                  className={`py-2 rounded-lg text-[11px] font-bold border-2 transition-all ${mForm.status === k ? 'scale-105' : ''}`}
                  style={{ borderColor: mForm.status === k ? '#0A2540' : '#E2E8F0', background: mForm.status === k ? '#F1F5F9' : '#fff' }}>
                  {v.label}
                </button>
              ))}
            </div>
            <label className="input-label">Priority</label>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                <button key={k} onClick={() => setMForm(f => ({ ...f, priority: k }))}
                  className={`py-1.5 rounded-lg text-[11px] font-bold border-2 ${v.color}`}
                  style={{ borderColor: mForm.priority === k ? '#0A2540' : '#E2E8F0' }}>
                  {v.label}
                </button>
              ))}
            </div>
            <label className="input-label">Official Response</label>
            <textarea value={mForm.admin_notes} onChange={e => setMForm(f => ({ ...f, admin_notes: e.target.value }))} rows={3} className="input resize-y mb-4" placeholder="Visible to all users…" />
            <div className="flex gap-2.5">
              <button onClick={() => setModalProblem(null)} className="btn btn-ghost flex-1 justify-center">Cancel</button>
              <button onClick={saveStatus} className="btn btn-navy flex-[2] justify-center"><CheckCircle className="w-4 h-4" /> Save Changes</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
