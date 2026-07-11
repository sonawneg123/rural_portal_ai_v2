// src/pages/CMDashboard.js — Chief Minister Dashboard
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { getError } from '../utils/api';
import { Button, SectionHeader, BudgetCard, StatusBadge, Spinner, EmptyState } from '../components/ui';
import { formatBudget, STATUS_CONFIG } from '../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Users, IndianRupee, MapPin, ChevronRight, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#0A2540','#635BFF','#00D4B2','#F59E0B','#EF4444','#10B981','#3B82F6','#8B5CF6'];

function StatCard({ label, value, sub, icon:Icon, color, delay=0 }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{ background:'var(--surface)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', padding:'20px', boxShadow:'var(--shadow-sm)', opacity:vis?1:0, transform:vis?'translateY(0)':'translateY(20px)', transition:'all 0.5s ease' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ width:42, height:42, borderRadius:'var(--r-md)', background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={20} color={color}/>
        </div>
        <span style={{ fontSize:10, fontWeight:700, color:'var(--text-40)', textTransform:'uppercase', letterSpacing:0.5 }}>{label}</span>
      </div>
      <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:900, color:'var(--text)', letterSpacing:'-0.8px', marginBottom:4 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:'var(--text-60)' }}>{sub}</div>}
    </div>
  );
}

function BudgetAllocator({ districts, onAllocate }) {
  const [sel,    setSel]    = useState('');
  const [amount, setAmount] = useState('');
  const [busy,   setBusy]   = useState(false);

  const submit = async () => {
    if (!sel || !amount) { toast.error('Select a district and enter amount'); return; }
    setBusy(true);
    try {
      await api.post('/cm/budget/allocate', { district: sel, amount: Number(amount) });
      toast.success(`₹${Number(amount).toLocaleString('en-IN')} allocated to ${sel}`);
      setAmount(''); setSel('');
      onAllocate();
    } catch (err) { toast.error(getError(err)); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ background:'linear-gradient(135deg,var(--navy),var(--navy-light))', borderRadius:'var(--r-xl)', padding:'24px', color:'#fff' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <IndianRupee size={20} color="var(--teal)"/>
        <div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, color:'#fff' }}>Allocate District Budget</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)' }}>Funds flow from State → District → Taluka → Village</div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:12, alignItems:'flex-end' }}>
        <div>
          <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', display:'block', marginBottom:6 }}>Select District</label>
          <select value={sel} onChange={e => setSel(e.target.value)}
            style={{ width:'100%', padding:'10px 12px', borderRadius:'var(--r-md)', border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.1)', color:'#fff', fontSize:13, outline:'none' }}>
            <option value="" style={{ color:'#000' }}>Choose district…</option>
            {districts.map(d => <option key={d} value={d} style={{ color:'#000' }}>{d}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', display:'block', marginBottom:6 }}>Amount (₹)</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="e.g. 5000000"
            style={{ width:'100%', padding:'10px 12px', borderRadius:'var(--r-md)', border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.1)', color:'#fff', fontSize:13, outline:'none' }}/>
        </div>
        <Button variant="teal" onClick={submit} loading={busy}>Allocate</Button>
      </div>
    </div>
  );
}

export default function CMDashboard() {
  const { user }  = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [selDist, setSelDist] = useState('');
  const [selTaluka, setSelTaluka] = useState('');
  const [selVillage, setSelVillage] = useState('');
  const [problems,   setProblems]   = useState([]);
  const [probLoad,   setProbLoad]   = useState(false);
  const [activeTab,  setActiveTab]  = useState('overview');

  const load = async () => {
    setLoading(true);
    try {
      const { data: d } = await api.get('/cm/dashboard');
      setData(d);
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filterProblems = async () => {
    if (!selDist) { toast.error('Select at least a district'); return; }
    setProbLoad(true);
    try {
      const params = new URLSearchParams({ state: user?.state || '', district: selDist });
      if (selTaluka)  params.append('taluka',  selTaluka);
      if (selVillage) params.append('village', selVillage);
      const { data: d } = await api.get(`/problems?${params}`);
      setProblems(d.data || []);
    } catch (err) { toast.error(getError(err)); }
    finally { setProbLoad(false); }
  };

  if (loading) return <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center' }}><Spinner size={36}/></div>;

  const s    = data?.summary || {};
  const tabs = ['overview','budget','issues','districts'];

  return (
    <div className="page-enter" style={{ background:'var(--bg)', minHeight:'100vh' }}>

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,var(--navy) 0%,var(--navy-light) 100%)', padding:'32px 0 40px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-60, right:-60, width:240, height:240, borderRadius:'50%', background:'rgba(0,212,178,0.08)' }}/>
        <div style={{ position:'absolute', bottom:-40, left:'10%', width:160, height:160, borderRadius:'50%', background:'rgba(99,91,255,0.08)' }}/>
        <div className="container" style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
            <div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(0,212,178,0.15)', border:'1px solid rgba(0,212,178,0.3)', borderRadius:'var(--r-full)', padding:'4px 12px', fontSize:11, fontWeight:700, color:'var(--teal)', marginBottom:14, letterSpacing:0.4 }}>
                🏛️ Chief Minister Dashboard
              </div>
              <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(24px,3.5vw,38px)', fontWeight:900, color:'#fff', letterSpacing:'-1px', marginBottom:6 }}>
                {user?.state || 'State'} Overview
              </h1>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.65)' }}>
                Real-time governance data across all districts, talukas and villages
              </p>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <Button variant="teal" size="sm" onClick={() => setActiveTab('budget')}>
                <IndianRupee size={14}/> Allocate Budget
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:2, marginTop:24, background:'rgba(255,255,255,0.08)', borderRadius:'var(--r-md)', padding:3, width:'fit-content', flexWrap:'wrap' }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ padding:'7px 16px', borderRadius:'var(--r-sm)', border:'none', cursor:'pointer', fontSize:13, fontWeight:500, textTransform:'capitalize', transition:'all var(--t-fast)', background:activeTab===t?'rgba(255,255,255,0.95)':'transparent', color:activeTab===t?'var(--navy)':'rgba(255,255,255,0.7)' }}>
                {t === 'budget' ? '💰 Budget' : t === 'issues' ? '📋 Issues' : t === 'districts' ? '🗺 Districts' : '📊 Overview'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop:28, paddingBottom:60 }}>

        {/* ── Overview tab ── */}
        {activeTab === 'overview' && (
          <div>
            <div className="grid-4" style={{ marginBottom:24 }}>
              <StatCard label="Total Problems" value={s.total_problems||0} icon={AlertTriangle} color="var(--danger)" delay={0}/>
              <StatCard label="Resolved"       value={s.resolved||0}       icon={CheckCircle}   color="var(--success)" delay={80}/>
              <StatCard label="Citizens"        value={s.total_users||0}    icon={Users}         color="var(--navy)" delay={160}/>
              <StatCard label="Budget Allocated" value={formatBudget(s.total_budget||0)} sub="across all districts" icon={IndianRupee} color="var(--purple)" delay={240}/>
            </div>

            <div className="grid-2" style={{ gap:20, marginBottom:24 }}>
              <div style={{ background:'var(--surface)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', padding:'20px', boxShadow:'var(--shadow-sm)' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:16 }}>Problems by Category</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data?.byCategory||[]} barSize={24}>
                    <XAxis dataKey="name" tick={{ fontSize:10, fill:'var(--text-60)' }} interval={0} angle={-20} textAnchor="end" height={50}/>
                    <YAxis tick={{ fontSize:10, fill:'var(--text-40)' }}/>
                    <Tooltip contentStyle={{ borderRadius:8, border:'1px solid var(--border)', fontSize:12 }}/>
                    <Bar dataKey="count" name="Problems" radius={[6,6,0,0]}>
                      {(data?.byCategory||[]).map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background:'var(--surface)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', padding:'20px', boxShadow:'var(--shadow-sm)' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:16 }}>District-wise Status</div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data?.byDistrict||[]} dataKey="count" nameKey="district" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2}>
                      {(data?.byDistrict||[]).map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius:8, border:'1px solid var(--border)', fontSize:12 }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top urgent */}
            <div style={{ background:'var(--surface)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', padding:'20px', boxShadow:'var(--shadow-sm)' }}>
              <SectionHeader title="Most Urgent — Statewide" subtitle="Sorted by severity and upvotes"/>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>#</th><th>Problem</th><th>District</th><th>Status</th><th>Severity</th><th>Upvotes</th></tr></thead>
                  <tbody>
                    {(data?.urgent||[]).slice(0,10).map((p,i) => (
                      <tr key={p.id}>
                        <td style={{ color:'var(--text-40)', fontWeight:500 }}>{i+1}</td>
                        <td style={{ fontWeight:600, maxWidth:200 }}>{p.title}</td>
                        <td style={{ color:'var(--text-60)', fontSize:12 }}><MapPin size={11} style={{ verticalAlign:-2 }}/> {p.district}</td>
                        <td><StatusBadge status={p.status}/></td>
                        <td style={{ fontWeight:700, color:p.ai_severity_score>=8?'var(--danger)':p.ai_severity_score>=5?'var(--warning)':'var(--success)' }}>{p.ai_severity_score||'—'}/10</td>
                        <td style={{ fontWeight:600, color:'var(--purple)' }}>{p.upvotes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Budget tab ── */}
        {activeTab === 'budget' && (
          <div>
            <BudgetAllocator districts={data?.districts||[]} onAllocate={load}/>
            <div style={{ marginTop:24 }}>
              <SectionHeader title="District Budget Allocation" subtitle="Track fund utilisation across all districts"/>
              <div className="grid-3" style={{ gap:16 }}>
                {(data?.districtBudgets||[]).map(d => (
                  <BudgetCard key={d.district} label={d.district} allocated={d.allocated||0} used={d.used||0} color="var(--navy)"/>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Issues filter tab ── */}
        {activeTab === 'issues' && (
          <div>
            <SectionHeader title="Filter Issues by Location" subtitle="Drill down by district, taluka and village"/>
            <div style={{ background:'var(--surface)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', padding:'24px', marginBottom:24, boxShadow:'var(--shadow-sm)' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, alignItems:'flex-end' }}>
                <div>
                  <label className="input-label">District</label>
                  <select className="input" value={selDist} onChange={e => { setSelDist(e.target.value); setSelTaluka(''); setSelVillage(''); }}>
                    <option value="">All districts</option>
                    {(data?.districts||[]).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Taluka</label>
                  <select className="input" value={selTaluka} onChange={e => setSelTaluka(e.target.value)}>
                    <option value="">All talukas</option>
                    {(data?.talukas||[]).filter(t => !selDist || t.district===selDist).map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Village</label>
                  <select className="input" value={selVillage} onChange={e => setSelVillage(e.target.value)}>
                    <option value="">All villages</option>
                    {(data?.villages||[]).filter(v => !selTaluka || v.taluka===selTaluka).map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                  </select>
                </div>
                <Button variant="navy" onClick={filterProblems} loading={probLoad}><Filter size={14}/> Apply</Button>
              </div>
            </div>

            {probLoad ? (
              <div style={{ display:'flex', justifyContent:'center', padding:40 }}><Spinner size={32}/></div>
            ) : problems.length > 0 ? (
              <div className="table-wrapper" style={{ background:'var(--surface)', borderRadius:'var(--r-xl)' }}>
                <table>
                  <thead><tr><th>Title</th><th>Village</th><th>Status</th><th>Severity</th><th>Upvotes</th><th>Work Updates</th></tr></thead>
                  <tbody>
                    {problems.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight:600, maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title}</td>
                        <td style={{ fontSize:12, color:'var(--text-60)' }}>{p.village}</td>
                        <td><StatusBadge status={p.status}/></td>
                        <td style={{ fontWeight:700, color:p.ai_severity_score>=8?'var(--danger)':'var(--warning)' }}>{p.ai_severity_score||'—'}</td>
                        <td>{p.upvotes}</td>
                        <td>{p.work_updates_count||0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState emoji="🗺️" title="Select filters above to explore" description="Pick a district, taluka or village to see all reported problems in that area"/>}
          </div>
        )}

        {/* ── Districts tab ── */}
        {activeTab === 'districts' && (
          <div>
            <SectionHeader title="District Summary" subtitle="All districts in the state at a glance"/>
            <div className="grid-3" style={{ gap:16 }}>
              {(data?.byDistrict||[]).map((d,i) => (
                <div key={d.district} style={{ background:'var(--surface)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', padding:'18px', boxShadow:'var(--shadow-sm)', animation:`fadeInUp 0.4s ease ${i*0.05}s both`, opacity:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                    <div style={{ width:38, height:38, borderRadius:'var(--r-md)', background:'var(--bg-alt)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontWeight:800, fontSize:14, color:'var(--navy)' }}>
                      {d.district.slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ fontWeight:700, color:'var(--text)', fontSize:15 }}>{d.district}</div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {[
                      { label:'Problems', val:d.count,    color:'var(--danger)' },
                      { label:'Resolved', val:d.resolved, color:'var(--success)' },
                    ].map(s => (
                      <div key={s.label} style={{ background:'var(--bg-alt)', borderRadius:'var(--r-md)', padding:'10px 12px', textAlign:'center' }}>
                        <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, color:s.color }}>{s.val||0}</div>
                        <div style={{ fontSize:10, color:'var(--text-60)', fontWeight:600, textTransform:'uppercase', letterSpacing:0.4 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-60)', marginBottom:5 }}>
                      <span>Resolution rate</span>
                      <span style={{ fontWeight:700 }}>{d.count>0?Math.round((d.resolved||0)/d.count*100):0}%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width:`${d.count>0?Math.round((d.resolved||0)/d.count*100):0}%` }}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
