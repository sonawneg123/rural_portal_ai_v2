// src/pages/CollectorDashboard.js — District Collector Dashboard
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { getError } from '../utils/api';
import { Button, SectionHeader, BudgetCard, StatusBadge, Spinner, EmptyState, AIChip } from '../components/ui';
import { formatBudget, STATUS_CONFIG } from '../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { IndianRupee, MapPin, Filter, TrendingUp, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#0A2540','#635BFF','#00D4B2','#F59E0B','#EF4444','#10B981'];

export default function CollectorDashboard() {
  const { user } = useAuth();
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('overview');
  const [selTaluka,setSelTaluka]= useState('');
  const [selVillage,setSelVillage]= useState('');
  const [problems, setProblems] = useState([]);
  const [probLoad, setProbLoad] = useState(false);
  const [allocForm,setAllocForm]= useState({ taluka:'', amount:'' });
  const [allocBusy,setAllocBusy]= useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data: d } = await api.get('/collector/dashboard');
      setData(d);
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filterProblems = async () => {
    setProbLoad(true);
    try {
      const params = new URLSearchParams({ district: user?.district || '' });
      if (selTaluka)  params.append('taluka',  selTaluka);
      if (selVillage) params.append('village', selVillage);
      const { data: d } = await api.get(`/problems?${params}`);
      setProblems(d.data || []);
    } catch (err) { toast.error(getError(err)); }
    finally { setProbLoad(false); }
  };

  const allocateBudget = async () => {
    if (!allocForm.taluka || !allocForm.amount) { toast.error('Select taluka and enter amount'); return; }
    setAllocBusy(true);
    try {
      await api.post('/collector/budget/allocate', { taluka: allocForm.taluka, amount: Number(allocForm.amount) });
      toast.success(`Budget allocated to ${allocForm.taluka}`);
      setAllocForm({ taluka:'', amount:'' });
      load();
    } catch (err) { toast.error(getError(err)); }
    finally { setAllocBusy(false); }
  };

  if (loading) return <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center' }}><Spinner size={36}/></div>;

  const s = data?.summary || {};
  const tabs = ['overview','budget','issues','talukas'];

  return (
    <div className="page-enter" style={{ background:'var(--bg)', minHeight:'100vh' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#2D1B69 0%,var(--purple) 100%)', padding:'32px 0 40px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-60, right:-60, width:220, height:220, borderRadius:'50%', background:'rgba(0,212,178,0.08)' }}/>
        <div className="container" style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
            <div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'var(--r-full)', padding:'4px 12px', fontSize:11, fontWeight:700, color:'#fff', marginBottom:14 }}>
                🏢 District Collector · {user?.district || 'District'}
              </div>
              <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(22px,3vw,36px)', fontWeight:900, color:'#fff', letterSpacing:'-0.8px', marginBottom:6 }}>
                {user?.district || 'District'} Control Room
              </h1>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.65)' }}>
                All talukas, villages and problems in your district
              </p>
            </div>
          </div>

          <div style={{ display:'flex', gap:2, marginTop:20, background:'rgba(255,255,255,0.08)', borderRadius:'var(--r-md)', padding:3, width:'fit-content', flexWrap:'wrap' }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding:'7px 16px', borderRadius:'var(--r-sm)', border:'none', cursor:'pointer', fontSize:13, fontWeight:500, textTransform:'capitalize', transition:'all var(--t-fast)', background:tab===t?'rgba(255,255,255,0.95)':'transparent', color:tab===t?'var(--purple)':'rgba(255,255,255,0.7)' }}>
                {t === 'budget' ? '💰 Budget' : t === 'issues' ? '📋 Issues' : t === 'talukas' ? '🗺 Talukas' : '📊 Overview'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop:28, paddingBottom:60 }}>

        {/* Overview */}
        {tab === 'overview' && (
          <div>
            <div className="grid-4" style={{ marginBottom:24 }}>
              {[
                { label:'Problems',   val:s.total_problems||0, color:'var(--danger)',   icon:<AlertTriangle size={20}/> },
                { label:'Pending',    val:s.pending||0,        color:'var(--warning)',  icon:<TrendingUp size={20}/> },
                { label:'Resolved',   val:s.resolved||0,       color:'var(--success)',  icon:<CheckCircle size={20}/> },
                { label:'Budget Left',val:formatBudget(s.budget_remaining||0), color:'var(--purple)', icon:<IndianRupee size={20}/> },
              ].map((c,i) => (
                <div key={i} style={{ background:'var(--surface)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', padding:18, boxShadow:'var(--shadow-sm)', animation:`fadeInUp 0.4s ease ${i*0.07}s both`, opacity:0 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <div style={{ width:38, height:38, borderRadius:'var(--r-md)', background:`${c.color}18`, display:'flex', alignItems:'center', justifyContent:'center', color:c.color }}>{c.icon}</div>
                    <span style={{ fontSize:10, fontWeight:700, color:'var(--text-40)', textTransform:'uppercase', letterSpacing:0.5 }}>{c.label}</span>
                  </div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:900, color:'var(--text)', letterSpacing:'-0.5px' }}>{c.val}</div>
                </div>
              ))}
            </div>

            <div style={{ background:'var(--surface)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', padding:20, marginBottom:20, boxShadow:'var(--shadow-sm)' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, marginBottom:14 }}>Problems by Taluka</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data?.byTaluka||[]} barSize={28}>
                  <XAxis dataKey="taluka" tick={{ fontSize:11, fill:'var(--text-60)' }}/>
                  <YAxis tick={{ fontSize:10, fill:'var(--text-40)' }}/>
                  <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }}/>
                  <Bar dataKey="count" name="Problems" radius={[6,6,0,0]}>
                    {(data?.byTaluka||[]).map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recent with AI insight */}
            <div style={{ background:'var(--surface)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', padding:20, boxShadow:'var(--shadow-sm)' }}>
              <SectionHeader title="Highest Priority" subtitle="Critical problems needing immediate attention"/>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {(data?.critical||[]).slice(0,5).map(p => (
                  <div key={p.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 14px', background:'var(--bg-alt)', borderRadius:'var(--r-md)', border:'1px solid var(--border)' }}>
                    <div style={{ width:38, height:38, borderRadius:'var(--r-md)', background:p.ai_severity_score>=8?'var(--danger-bg)':'var(--warning-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontWeight:900, fontSize:14, color:p.ai_severity_score>=8?'var(--danger)':'var(--warning)', flexShrink:0 }}>
                      {p.ai_severity_score||'?'}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:600, fontSize:14, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.title}</div>
                      <div style={{ fontSize:11, color:'var(--text-60)', display:'flex', alignItems:'center', gap:4 }}><MapPin size={10}/>{p.village}, {p.taluka}</div>
                    </div>
                    <StatusBadge status={p.status}/>
                  </div>
                ))}
                {!(data?.critical||[]).length && <EmptyState emoji="✅" title="No critical problems" description="All issues in your district are under control"/>}
              </div>
            </div>
          </div>
        )}

        {/* Budget */}
        {tab === 'budget' && (
          <div>
            <div style={{ background:'linear-gradient(135deg,#2D1B69,var(--purple))', borderRadius:'var(--r-xl)', padding:24, marginBottom:24, color:'#fff' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, marginBottom:6 }}>Allocate Taluka Budget</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.65)', marginBottom:20 }}>
                Your district received {formatBudget(s.budget_allocated||0)} from the state · {formatBudget(s.budget_remaining||0)} remaining
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:12, alignItems:'flex-end' }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', display:'block', marginBottom:6 }}>Taluka</label>
                  <select value={allocForm.taluka} onChange={e => setAllocForm(f => ({ ...f, taluka:e.target.value }))}
                    style={{ width:'100%', padding:'10px 12px', borderRadius:'var(--r-md)', border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.1)', color:'#fff', fontSize:13, outline:'none' }}>
                    <option value="" style={{ color:'#000' }}>Select taluka…</option>
                    {(data?.talukas||[]).map(t => <option key={t} value={t} style={{ color:'#000' }}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', display:'block', marginBottom:6 }}>Amount (₹)</label>
                  <input type="number" value={allocForm.amount} onChange={e => setAllocForm(f => ({ ...f, amount:e.target.value }))}
                    placeholder="e.g. 1000000"
                    style={{ width:'100%', padding:'10px 12px', borderRadius:'var(--r-md)', border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.1)', color:'#fff', fontSize:13, outline:'none' }}/>
                </div>
                <Button variant="teal" onClick={allocateBudget} loading={allocBusy}><IndianRupee size={14}/> Allocate</Button>
              </div>
            </div>
            <div className="grid-3" style={{ gap:16 }}>
              {(data?.talukaBudgets||[]).map(t => (
                <BudgetCard key={t.taluka} label={t.taluka} allocated={t.allocated||0} used={t.used||0} color="var(--purple)"/>
              ))}
            </div>
          </div>
        )}

        {/* Issues filter */}
        {tab === 'issues' && (
          <div>
            <div style={{ background:'var(--surface)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', padding:24, marginBottom:20, boxShadow:'var(--shadow-sm)' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, alignItems:'flex-end' }}>
                <div>
                  <label className="input-label">Taluka</label>
                  <select className="input" value={selTaluka} onChange={e => { setSelTaluka(e.target.value); setSelVillage(''); }}>
                    <option value="">All talukas</option>
                    {(data?.talukas||[]).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Village</label>
                  <select className="input" value={selVillage} onChange={e => setSelVillage(e.target.value)}>
                    <option value="">All villages</option>
                    {(data?.villages||[]).filter(v => !selTaluka || v.taluka===selTaluka).map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                  </select>
                </div>
                <Button variant="navy" onClick={filterProblems} loading={probLoad}><Filter size={14}/> Filter</Button>
              </div>
            </div>
            {probLoad ? <div style={{ textAlign:'center', padding:40 }}><Spinner size={32}/></div> :
             problems.length > 0 ? (
              <div className="table-wrapper" style={{ background:'var(--surface)', borderRadius:'var(--r-xl)' }}>
                <table>
                  <thead><tr><th>Title</th><th>Village</th><th>Taluka</th><th>Status</th><th>Severity</th><th>AI Tags</th></tr></thead>
                  <tbody>
                    {problems.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight:600, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title}</td>
                        <td style={{ fontSize:12, color:'var(--text-60)' }}>{p.village}</td>
                        <td style={{ fontSize:12, color:'var(--text-60)' }}>{p.taluka||'—'}</td>
                        <td><StatusBadge status={p.status}/></td>
                        <td style={{ fontWeight:700, color:p.ai_severity_score>=8?'var(--danger)':'var(--warning)' }}>{p.ai_severity_score||'—'}</td>
                        <td style={{ fontSize:11, color:'var(--purple)' }}>{p.ai_tags?.split(',').slice(0,2).join(', ')||'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState emoji="🔍" title="Apply filters to explore" description="Select a taluka or village to see problems"/>}
          </div>
        )}

        {/* Talukas */}
        {tab === 'talukas' && (
          <div className="grid-3" style={{ gap:16 }}>
            {(data?.talukaStats||[]).map((t,i) => (
              <div key={t.taluka} style={{ background:'var(--surface)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', padding:18, boxShadow:'var(--shadow-sm)', animation:`fadeInUp 0.4s ease ${i*0.06}s both`, opacity:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                  <div style={{ width:38, height:38, borderRadius:'var(--r-md)', background:'linear-gradient(135deg,#2D1B69,var(--purple))', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontFamily:'var(--font-display)', fontWeight:800, fontSize:13 }}>
                    {t.taluka?.slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ fontWeight:700, fontSize:15 }}>{t.taluka}</div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
                  <div style={{ background:'var(--danger-bg)', borderRadius:'var(--r-md)', padding:'8px 10px', textAlign:'center' }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color:'var(--danger)' }}>{t.total||0}</div>
                    <div style={{ fontSize:9, color:'var(--danger)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.3 }}>Total</div>
                  </div>
                  <div style={{ background:'var(--success-bg)', borderRadius:'var(--r-md)', padding:'8px 10px', textAlign:'center' }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color:'var(--success)' }}>{t.resolved||0}</div>
                    <div style={{ fontSize:9, color:'var(--success)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.3 }}>Resolved</div>
                  </div>
                </div>
                <div style={{ fontSize:12, color:'var(--text-60)', marginBottom:6 }}>
                  {t.villages||0} villages · Avg severity {t.avg_severity||'—'}
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width:`${t.total>0?Math.round((t.resolved/t.total)*100):0}%`, background:'linear-gradient(90deg,#2D1B69,var(--purple))' }}/>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
