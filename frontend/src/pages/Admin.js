// src/pages/Admin.js
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api, { getError } from '../utils/api';
import { STATUS_CONFIG, PRIORITY_CONFIG, formatDate, timeAgo } from '../utils/helpers';
import { useScrollReveal, useCountUp } from '../hooks/useAnimations';
import { Button, Spinner, EmptyState, AIChip } from '../components/ui';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, FileText, Users, Shield,
  CheckCircle, Clock, TrendingUp, AlertTriangle,
  ChevronDown, Sparkles, Loader, X, Camera,
  BarChart2, MapPin, Zap, Eye, ThumbsUp,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts';

const TABS   = ['Overview', 'Problems', 'Users', 'Analytics'];
const PIE_COLORS = ['#0A3D1F','#7FD43A','#D97706','#DC2626','#7C3AED','#2563EB','#EC4899','#10B981'];

/* ── Animated stat card ─────────────────────────────────────── */
function AdminStat({ label, value, icon: Icon, color, delay = 0, suffix = '' }) {
  const [ref, vis] = useScrollReveal(0.1);
  const count      = useCountUp(value, 1000, vis);
  const [hov, setHov] = useState(false);
  return (
    <div ref={ref}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff', borderRadius: 'var(--r-xl)',
        border: `1px solid ${hov ? color + '44' : 'var(--border)'}`,
        padding: '20px 18px', textAlign: 'center',
        boxShadow: hov ? `0 8px 28px ${color}22` : 'var(--shadow-sm)',
        transform: vis ? (hov ? 'translateY(-5px) scale(1.03)' : 'translateY(0)') : 'translateY(28px)',
        opacity: vis ? 1 : 0,
        transition: `all 0.45s cubic-bezier(0.34,1.3,0.64,1) ${delay}s`,
      }}>
      <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
        <Icon size={22} color={color}/>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: 'var(--ink)', letterSpacing: '-1px', marginBottom: 4 }}>
        {count.toLocaleString('en-IN')}{suffix}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-60)', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

/* ── Custom tooltip ─────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '10px 14px', boxShadow: 'var(--shadow-md)', fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 5, color: 'var(--ink)' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

export default function Admin() {
  const { user, isAdmin }  = useAuth();
  const navigate           = useNavigate();
  const [tab,      setTab]      = useState('Overview');
  const [dashData, setDashData] = useState(null);
  const [problems, setProblems] = useState([]);
  const [users,    setUsers]    = useState([]);
  const [analytics,setAnalytics]= useState(null);
  const [loading,  setLoading]  = useState(true);

  // Modal state
  const [modal,    setModal]    = useState(null);
  const [modalVis, setModalVis] = useState(false);
  const [mForm,    setMForm]    = useState({ status: '', priority: '', admin_notes: '' });

  // Groq insights cache per problem
  const [insights,     setInsights]     = useState({});
  const [insightLoads, setInsightLoads] = useState({});

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery,  setSearchQuery]  = useState('');

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    loadTab('Overview');
  }, [isAdmin]); // eslint-disable-line

  const loadTab = async (t) => {
    setLoading(true);
    try {
      if (t === 'Overview') {
        const { data } = await api.get('/admin/dashboard');
        setDashData(data.data);
      } else if (t === 'Problems') {
        const { data } = await api.get(`/admin/problems?limit=50${statusFilter ? `&status=${statusFilter}` : ''}`);
        setProblems(data.data || []);
      } else if (t === 'Users') {
        const { data } = await api.get('/admin/users?limit=50');
        setUsers(data.data || []);
      } else if (t === 'Analytics') {
        const { data } = await api.get('/admin/analytics').catch(() => ({ data: { data: null } }));
        setAnalytics(data.data);
      }
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (t) => {
    setTab(t);
    loadTab(t);
  };

  const openModal = (p) => {
    setMForm({ status: p.status, priority: p.priority, admin_notes: '' });
    setModal(p);
    setTimeout(() => setModalVis(true), 10);
  };

  const closeModal = () => {
    setModalVis(false);
    setTimeout(() => { setModal(null); setModalVis(false); }, 260);
  };

  const saveStatus = async () => {
    try {
      await api.patch(`/admin/problems/${modal.id}/status`, mForm);
      toast.success('Problem updated ✅');
      closeModal();
      loadTab('Problems');
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const toggleUser = async (id) => {
    await api.patch(`/admin/users/${id}/toggle`);
    toast.success('User status changed');
    loadTab('Users');
  };

  const fetchInsight = async (pid) => {
    setInsightLoads(p => ({ ...p, [pid]: true }));
    try {
      const { data } = await api.get(`/admin/problems/${pid}/insight`);
      setInsights(p => ({ ...p, [pid]: data.insight }));
    } catch {
      toast.error('Could not load AI insight');
    } finally {
      setInsightLoads(p => ({ ...p, [pid]: false }));
    }
  };

  const filteredProblems = problems.filter(p => {
    if (statusFilter && p.status !== statusFilter) return false;
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const inputSt = { width: '100%', padding: '9px 12px', border: '1.5px solid var(--border-dark)', borderRadius: 'var(--r-md)', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-body)', color: 'var(--ink)', transition: 'border-color 0.15s' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface)' }}>

      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside style={{
        width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(180deg, var(--forest) 0%, #0D4A25 60%, #0A3D1F 100%)',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
        animation: 'fadeInLeft 0.4s ease both',
      }}>
        {/* Logo */}
        <div style={{ padding: '22px 18px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(127,212,58,0.2)', border: '1px solid rgba(127,212,58,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={17} color="var(--lime)"/>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: '#fff' }}>Admin Panel</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>ग्रामीण पोर्टल</div>
            </div>
          </div>
        </div>

        {/* User info */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--forest)', fontSize: 15, fontWeight: 800, flexShrink: 0 }}>
            {user?.name?.[0]}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{user?.name}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>Administrator</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {[
            { label: 'Overview',   icon: <LayoutDashboard size={15}/> },
            { label: 'Problems',   icon: <FileText size={15}/> },
            { label: 'Users',      icon: <Users size={15}/> },
            { label: 'Analytics',  icon: <BarChart2 size={15}/> },
          ].map((item, i) => (
            <button key={item.label}
              onClick={() => switchTab(item.label)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '10px 12px', borderRadius: 'var(--r-md)',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                background: tab === item.label ? 'rgba(127,212,58,0.15)' : 'transparent',
                color: tab === item.label ? 'var(--lime)' : 'rgba(255,255,255,0.55)',
                fontSize: 13, fontWeight: tab === item.label ? 700 : 400,
                marginBottom: 2,
                transform: tab === item.label ? 'translateX(4px)' : 'translateX(0)',
                transition: 'all 0.2s ease',
                animation: `fadeInLeft 0.4s ease ${0.1 + i * 0.07}s both`,
              }}
              onMouseEnter={e => { if (tab !== item.label) { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='rgba(255,255,255,0.85)'; }}}
              onMouseLeave={e => { if (tab !== item.label) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.55)'; }}}>
              {item.icon}{item.label}
              {item.label === 'Problems' && dashData?.summary?.pending > 0 && (
                <span style={{ marginLeft: 'auto', background: 'var(--danger)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 'var(--r-full)' }}>
                  {dashData.summary.pending}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Groq AI badge */}
        <div style={{ margin: '12px', padding: '12px', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 'var(--r-lg)', animation: 'fadeIn 0.5s ease 0.5s both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Sparkles size={13} color="#A78BFA" style={{ animation: 'pulse 2s ease-in-out infinite' }}/>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#C4B5FD' }}>Groq AI Active</span>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(139,92,246,0.7)' }}>llama3-8b-8192 · Auto-scoring</div>
        </div>

        {/* Quick links */}
        <div style={{ padding: '0 8px 16px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 'var(--r-md)', textDecoration: 'none', fontSize: 12, color: 'rgba(255,255,255,0.4)', transition: 'all var(--t-fast)' }}
            onMouseEnter={e => e.currentTarget.style.color='rgba(255,255,255,0.8)'}
            onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.4)'}>
            ← Back to Portal
          </Link>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '28px 28px 60px', overflow: 'auto' }}>

        {/* ── Overview tab ─────────────────────────────────── */}
        {tab === 'Overview' && (
          <div style={{ animation: 'fadeIn 0.35s ease both' }}>
            <div style={{ marginBottom: 26 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.5px', marginBottom: 4 }}>Dashboard Overview</h1>
              <p style={{ fontSize: 13, color: 'var(--ink-60)' }}>Real-time data · Updated every page load</p>
            </div>

            {dashData && (
              <>
                {/* Stat grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', gap: 14, marginBottom: 26 }}>
                  <AdminStat label="Total Reports"   value={dashData.summary.total_problems} icon={FileText}     color="#2563EB" delay={0}    />
                  <AdminStat label="Pending"         value={dashData.summary.pending}         icon={Clock}        color="#D97706" delay={0.07} />
                  <AdminStat label="In Progress"     value={dashData.summary.in_progress}     icon={TrendingUp}   color="#7C3AED" delay={0.14} />
                  <AdminStat label="Resolved"        value={dashData.summary.resolved}        icon={CheckCircle}  color="#16A34A" delay={0.21} />
                  <AdminStat label="Total Citizens"  value={dashData.summary.total_users}     icon={Users}        color="#EC4899" delay={0.28} />
                  <AdminStat label="Today"           value={dashData.summary.today_reports}   icon={AlertTriangle}color="#EF4444" delay={0.35} />
                </div>

                {/* Charts row */}
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 24 }}>
                  {/* Bar chart */}
                  <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', padding: '20px 18px', boxShadow: 'var(--shadow-sm)', animation: 'fadeInUp 0.4s ease 0.25s both', opacity: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 16 }}>Problems by Category</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={dashData.byCategory} barSize={28}>
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--ink-60)' }} interval={0} angle={-22} textAnchor="end" height={52}/>
                        <YAxis tick={{ fontSize: 10, fill: 'var(--ink-40)' }}/>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Bar dataKey="count" name="Problems" radius={[6,6,0,0]}>
                          {dashData.byCategory.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Pie chart */}
                  <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', padding: '20px 18px', boxShadow: 'var(--shadow-sm)', animation: 'fadeInUp 0.4s ease 0.32s both', opacity: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 16 }}>Top States</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={dashData.byState} dataKey="count" nameKey="state" cx="50%" cy="50%" outerRadius={75} innerRadius={35} paddingAngle={2}>
                          {dashData.byState.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                        </Pie>
                        <Tooltip content={<CustomTooltip/>}/>
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Legend */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                      {dashData.byState.slice(0,4).map((s, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: 'var(--ink-60)' }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }}/>
                          {s.state}: {s.count}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent table */}
                <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', animation: 'fadeInUp 0.4s ease 0.38s both', opacity: 0 }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Recent Reports</span>
                    <button onClick={() => switchTab('Problems')} style={{ fontSize: 12, fontWeight: 600, color: 'var(--forest)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      View all →
                    </button>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: 'var(--surface)' }}>
                        {['Title','Category','Status','Priority','Upvotes','Date'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--ink-60)', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dashData.recentProblems?.map((p, i) => {
                        const st = STATUS_CONFIG[p.status];
                        const pr = PRIORITY_CONFIG[p.priority];
                        return (
                          <tr key={p.id} style={{ borderTop: '1px solid var(--border)', transition: 'background var(--t-fast)', animation: `fadeIn 0.35s ease ${i * 0.05}s both`, opacity: 0 }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '11px 16px', fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--ink)' }}>
                              <Link to={`/problems/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>{p.title}</Link>
                            </td>
                            <td style={{ padding: '11px 16px', color: 'var(--ink-60)' }}>{p.category}</td>
                            <td style={{ padding: '11px 16px' }}>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 'var(--r-full)', color: st?.color, background: st?.bg }}>{st?.label}</span>
                            </td>
                            <td style={{ padding: '11px 16px', color: pr?.color, fontWeight: 700, fontSize: 12 }}>{pr?.label}</td>
                            <td style={{ padding: '11px 16px', color: 'var(--ink-60)', display: 'flex', alignItems: 'center', gap: 5 }}>
                              <ThumbsUp size={12}/>{p.upvotes}
                            </td>
                            <td style={{ padding: '11px 16px', color: 'var(--ink-40)', fontSize: 12 }}>{formatDate(p.created_at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Problems tab ──────────────────────────────────── */}
        {tab === 'Problems' && (
          <div style={{ animation: 'fadeIn 0.35s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.5px' }}>Manage Problems</h1>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search problems…" style={{ ...inputSt, width: 220 }}
                  onFocus={e => e.target.style.borderColor='var(--forest)'}
                  onBlur={e => e.target.style.borderColor='var(--border-dark)'}/>
                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); loadTab('Problems'); }}
                  style={{ ...inputSt, width: 140 }}>
                  <option value="">All statuses</option>
                  {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
                  <Spinner size={32}/>
                </div>
              ) : filteredProblems.length === 0 ? (
                <EmptyState emoji="📋" title="No problems found" description="Try adjusting your filters"/>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 900 }}>
                    <thead>
                      <tr style={{ background: 'var(--surface)' }}>
                        {['#','Title','Location','Status','Severity','AI Summary','Groq Insight','Action'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--ink-60)', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProblems.map((p, i) => {
                        const st = STATUS_CONFIG[p.status];
                        return (
                          <tr key={p.id} style={{ borderTop: '1px solid var(--border)', transition: 'background var(--t-fast)', animation: `fadeIn 0.3s ease ${i * 0.04}s both`, opacity: 0 }}
                            onMouseEnter={e => e.currentTarget.style.background='var(--surface)'}
                            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                            <td style={{ padding: '10px 14px', color: 'var(--ink-40)', fontWeight: 500 }}>{p.id}</td>
                            <td style={{ padding: '10px 14px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <Link to={`/problems/${p.id}`} style={{ fontWeight: 600, color: 'var(--ink)', textDecoration: 'none' }}>{p.title}</Link>
                            </td>
                            <td style={{ padding: '10px 14px', color: 'var(--ink-60)', fontSize: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11}/>{p.district}, {p.state}</div>
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 'var(--r-full)', color: st?.color, background: st?.bg }}>{st?.label}</span>
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, color: p.ai_severity_score >= 8 ? 'var(--danger)' : p.ai_severity_score >= 5 ? 'var(--warning)' : 'var(--success)' }}>
                              {p.ai_severity_score || '—'}{p.ai_severity_score && <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--ink-40)' }}>/10</span>}
                            </td>
                            <td style={{ padding: '10px 14px', maxWidth: 200 }}>
                              {p.ai_summary ? (
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                                  <Sparkles size={11} color="var(--purple)" style={{ flexShrink: 0, marginTop: 2 }}/>
                                  <span style={{ fontSize: 11, color: 'var(--purple)', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.ai_summary}</span>
                                </div>
                              ) : <span style={{ color: 'var(--border-dark)', fontSize: 12 }}>—</span>}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              {insights[p.id] ? (
                                <span style={{ fontSize: 11, color: '#92400E', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxWidth: 160 }} title={insights[p.id]}>
                                  💡 {insights[p.id]}
                                </span>
                              ) : (
                                <button onClick={() => fetchInsight(p.id)} disabled={insightLoads[p.id]}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 'var(--r-sm)', fontSize: 10, fontWeight: 700, color: '#92400E', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all var(--t-fast)' }}
                                  onMouseEnter={e => e.currentTarget.style.background='#FDE68A'}
                                  onMouseLeave={e => e.currentTarget.style.background='#FEF3C7'}>
                                  {insightLoads[p.id] ? <Loader size={11} style={{ animation: 'spin 0.8s linear infinite' }}/> : <><Sparkles size={10}/> Ask Groq</>}
                                </button>
                              )}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <button onClick={() => openModal(p)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', background: 'var(--surface)', border: '1px solid var(--border-dark)', borderRadius: 'var(--r-md)', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--ink)', transition: 'all var(--t-fast)', whiteSpace: 'nowrap' }}
                                onMouseEnter={e => { e.currentTarget.style.background='var(--forest)'; e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='var(--forest)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background='var(--surface)'; e.currentTarget.style.color='var(--ink)'; e.currentTarget.style.borderColor='var(--border-dark)'; }}>
                                Update <ChevronDown size={12}/>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Users tab ─────────────────────────────────────── */}
        {tab === 'Users' && (
          <div style={{ animation: 'fadeIn 0.35s ease both' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.5px', marginBottom: 22 }}>Registered Citizens</h1>
            <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}><Spinner size={32}/></div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--surface)' }}>
                      {['Citizen','Email','Location','Reports','Joined','Status'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--ink-60)', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={u.id} style={{ borderTop: '1px solid var(--border)', transition: 'background var(--t-fast)', animation: `fadeIn 0.3s ease ${i * 0.04}s both`, opacity: 0 }}
                        onMouseEnter={e => e.currentTarget.style.background='var(--surface)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <td style={{ padding: '11px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--forest)', color: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{u.name[0]}</div>
                            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{u.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '11px 16px', color: 'var(--ink-60)' }}>{u.email}</td>
                        <td style={{ padding: '11px 16px', color: 'var(--ink-60)', fontSize: 12 }}>{u.district}, {u.state}</td>
                        <td style={{ padding: '11px 16px', fontWeight: 700, color: 'var(--ink)', textAlign: 'center' }}>{u.problems_count}</td>
                        <td style={{ padding: '11px 16px', color: 'var(--ink-40)', fontSize: 12 }}>{formatDate(u.created_at)}</td>
                        <td style={{ padding: '11px 16px' }}>
                          <button onClick={() => toggleUser(u.id)}
                            style={{ padding: '5px 12px', borderRadius: 'var(--r-md)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: u.is_active ? 'var(--danger-bg)' : 'var(--success-bg)', color: u.is_active ? 'var(--danger)' : 'var(--success)', transition: 'all var(--t-fast)' }}>
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── Analytics tab ─────────────────────────────────── */}
        {tab === 'Analytics' && (
          <div style={{ animation: 'fadeIn 0.35s ease both' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.5px', marginBottom: 22 }}>Analytics</h1>
            <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', padding: '40px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>Deep Analytics Coming Soon</div>
              <p style={{ fontSize: 14, color: 'var(--ink-60)', maxWidth: 400, margin: '0 auto' }}>
                Resolution time trends, district-level heatmaps, AI severity distribution, and seasonal patterns.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ── Status Update Modal ───────────────────────────────── */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20, opacity: modalVis ? 1 : 0, transition: 'opacity 0.25s ease', backdropFilter: 'blur(4px)' }}>
          <div style={{
            background: '#fff', borderRadius: 'var(--r-2xl)', padding: '28px', width: '100%', maxWidth: 480,
            boxShadow: 'var(--shadow-xl)',
            transform: modalVis ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.96)',
            transition: 'transform 0.3s cubic-bezier(0.34,1.2,0.64,1)',
          }}>
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)', marginBottom: 4 }}>Update Problem</h3>
                <p style={{ fontSize: 13, color: 'var(--ink-60)', maxWidth: 360, margin: 0 }}>{modal.title}</p>
              </div>
              <button onClick={closeModal} style={{ background: 'var(--surface)', border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: 'var(--ink-60)', transition: 'all var(--t-fast)' }}
                onMouseEnter={e => { e.currentTarget.style.background='var(--danger-bg)'; e.currentTarget.style.color='var(--danger)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='var(--surface)'; e.currentTarget.style.color='var(--ink-60)'; }}>
                <X size={17}/>
              </button>
            </div>

            {/* Status */}
            <label className="input-label">Status</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
              {Object.entries(STATUS_CONFIG).map(([k,v]) => (
                <button key={k} onClick={() => setMForm(f => ({ ...f, status: k }))}
                  style={{ padding: '8px 6px', borderRadius: 'var(--r-md)', border: `1.5px solid ${mForm.status === k ? v.color : 'var(--border)'}`, background: mForm.status === k ? v.bg : '#fff', color: mForm.status === k ? v.color : 'var(--ink-60)', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s', transform: mForm.status === k ? 'scale(1.04)' : 'scale(1)' }}>
                  {v.label}
                </button>
              ))}
            </div>

            {/* Priority */}
            <label className="input-label">Priority</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
              {Object.entries(PRIORITY_CONFIG).map(([k,v]) => (
                <button key={k} onClick={() => setMForm(f => ({ ...f, priority: k }))}
                  style={{ padding: '7px 4px', borderRadius: 'var(--r-md)', border: `1.5px solid ${mForm.priority === k ? v.color : 'var(--border)'}`, background: mForm.priority === k ? v.color + '18' : '#fff', color: mForm.priority === k ? v.color : 'var(--ink-60)', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s' }}>
                  {v.label}
                </button>
              ))}
            </div>

            {/* Admin notes */}
            <label className="input-label">Official Response / Admin Notes</label>
            <textarea value={mForm.admin_notes} onChange={e => setMForm(f => ({ ...f, admin_notes: e.target.value }))}
              style={{ ...inputSt, minHeight: 88, resize: 'vertical', marginBottom: 14 }}
              placeholder="Visible to all users on the problem page…"
              onFocus={e => e.target.style.borderColor='var(--forest)'}
              onBlur={e => e.target.style.borderColor='var(--border-dark)'}/>

            {/* Groq insight */}
            {insights[modal.id] ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'var(--purple-bg)', border: '1px solid #DDD6FE', borderRadius: 'var(--r-md)', padding: '10px 12px', marginBottom: 16, animation: 'fadeInUp 0.3s ease both' }}>
                <Sparkles size={13} color="var(--purple)" style={{ flexShrink: 0, marginTop: 1 }}/>
                <span style={{ fontSize: 12, color: 'var(--purple)', fontWeight: 500 }}><strong>Groq suggests:</strong> {insights[modal.id]}</span>
              </div>
            ) : (
              <button onClick={() => fetchInsight(modal.id)} disabled={insightLoads[modal.id]}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--purple-bg)', border: '1px solid #DDD6FE', borderRadius: 'var(--r-md)', fontSize: 12, fontWeight: 700, color: 'var(--purple)', cursor: 'pointer', marginBottom: 16, transition: 'all var(--t-fast)' }}
                onMouseEnter={e => e.currentTarget.style.background='#EDE9FE'}
                onMouseLeave={e => e.currentTarget.style.background='var(--purple-bg)'}>
                {insightLoads[modal.id] ? <Loader size={13} style={{ animation: 'spin 0.8s linear infinite' }}/> : <Sparkles size={13}/>}
                Get Groq AI suggestion
              </button>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="ghost" onClick={closeModal} style={{ flex: 1, justifyContent: 'center' }}>Cancel</Button>
              <Button variant="primary" onClick={saveStatus} style={{ flex: 2, justifyContent: 'center' }}>
                <CheckCircle size={15}/> Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
