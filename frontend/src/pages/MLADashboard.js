// src/pages/MLADashboard.js — MLA Dashboard
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { getError } from '../utils/api';
import { Button, SectionHeader, BudgetCard, StatusBadge, Spinner, EmptyState } from '../components/ui';
import { formatBudget } from '../utils/helpers';
import { IndianRupee, MapPin, Filter, Users, TrendingUp, AlertTriangle, CheckCircle, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MLADashboard() {
  const { user } = useAuth();
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('overview');
  const [selVillage,setSelVillage]= useState('');
  const [problems,  setProblems]  = useState([]);
  const [probLoad,  setProbLoad]  = useState(false);
  const [allocForm, setAllocForm] = useState({ village:'', amount:'' });
  const [allocBusy, setAllocBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data: d } = await api.get('/mla/dashboard');
      setData(d);
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const loadVillageProblems = async (village) => {
    setSelVillage(village);
    setProbLoad(true);
    try {
      const { data: d } = await api.get(`/problems?taluka=${encodeURIComponent(user?.taluka||'')}&village=${encodeURIComponent(village)}`);
      setProblems(d.data || []);
    } catch (err) { toast.error(getError(err)); }
    finally { setProbLoad(false); }
  };

  const allocateBudget = async () => {
    if (!allocForm.village || !allocForm.amount) { toast.error('Select village and enter amount'); return; }
    setAllocBusy(true);
    try {
      await api.post('/mla/budget/allocate', { village: allocForm.village, amount: Number(allocForm.amount) });
      toast.success(`Budget allocated to ${allocForm.village}`);
      setAllocForm({ village:'', amount:'' });
      load();
    } catch (err) { toast.error(getError(err)); }
    finally { setAllocBusy(false); }
  };

  if (loading) return <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center' }}><Spinner size={36}/></div>;

  const s    = data?.summary || {};
  const tabs = ['overview','villages','budget','issues'];

  return (
    <div className="page-enter" style={{ background:'var(--bg)', minHeight:'100vh' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#065F46 0%,#10B981 100%)', padding:'32px 0 40px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-50, right:-50, width:200, height:200, borderRadius:'50%', background:'rgba(0,212,178,0.1)' }}/>
        <div className="container" style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
            <div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'var(--r-full)', padding:'4px 12px', fontSize:11, fontWeight:700, color:'#fff', marginBottom:14 }}>
                🏘️ MLA · {user?.taluka || user?.district || 'Constituency'}
              </div>
              <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(22px,3vw,36px)', fontWeight:900, color:'#fff', letterSpacing:'-0.8px', marginBottom:6 }}>
                Constituency Dashboard
              </h1>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.7)' }}>
                {data?.villages?.length||0} villages · {s.total_problems||0} issues tracked
              </p>
            </div>
            <Button variant="teal" size="sm" style={{ background:'rgba(255,255,255,0.15)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)' }} onClick={() => setTab('budget')}>
              <IndianRupee size={14}/> Allocate to Village
            </Button>
          </div>

          <div style={{ display:'flex', gap:2, marginTop:20, background:'rgba(255,255,255,0.08)', borderRadius:'var(--r-md)', padding:3, width:'fit-content', flexWrap:'wrap' }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding:'7px 16px', borderRadius:'var(--r-sm)', border:'none', cursor:'pointer', fontSize:13, fontWeight:500, textTransform:'capitalize', transition:'all var(--t-fast)', background:tab===t?'rgba(255,255,255,0.95)':'transparent', color:tab===t?'#065F46':'rgba(255,255,255,0.75)' }}>
                {t === 'budget' ? '💰 Budget' : t === 'villages' ? '🏘 Villages' : t === 'issues' ? '📋 Issues' : '📊 Overview'}
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
                { label:'Total Issues',   val:s.total_problems||0,   color:'var(--danger)',  icon:<AlertTriangle size={18}/> },
                { label:'Pending',        val:s.pending||0,           color:'var(--warning)', icon:<TrendingUp size={18}/> },
                { label:'Resolved',       val:s.resolved||0,          color:'var(--success)', icon:<CheckCircle size={18}/> },
                { label:'Work Updates',   val:s.work_updates||0,      color:'var(--teal)',    icon:<Camera size={18}/> },
              ].map((c,i) => (
                <div key={i} style={{ background:'var(--surface)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', padding:18, boxShadow:'var(--shadow-sm)', animation:`fadeInUp 0.4s ease ${i*0.07}s both`, opacity:0 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <div style={{ width:36, height:36, borderRadius:'var(--r-md)', background:`${c.color}18`, display:'flex', alignItems:'center', justifyContent:'center', color:c.color }}>{c.icon}</div>
                    <span style={{ fontSize:10, fontWeight:700, color:'var(--text-40)', textTransform:'uppercase', letterSpacing:0.5 }}>{c.label}</span>
                  </div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:900, color:'var(--text)' }}>{c.val}</div>
                </div>
              ))}
            </div>

            {/* Budget summary */}
            <div style={{ background:'linear-gradient(135deg,#065F46,#10B981)', borderRadius:'var(--r-xl)', padding:'20px 24px', marginBottom:24, display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
              <IndianRupee size={32} color="rgba(255,255,255,0.6)"/>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:4 }}>Budget received from Collector</div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:900, color:'#fff' }}>{formatBudget(s.budget_allocated||0)}</div>
              </div>
              <div style={{ marginLeft:'auto', textAlign:'right' }}>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)' }}>Distributed to villages</div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, color:'var(--teal)' }}>{formatBudget(s.budget_distributed||0)}</div>
              </div>
            </div>

            {/* Top urgent issues */}
            <div style={{ background:'var(--surface)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', padding:20, boxShadow:'var(--shadow-sm)' }}>
              <SectionHeader title="Urgent Issues" subtitle="Requiring immediate MLA attention"/>
              {(data?.urgent||[]).slice(0,6).map(p => (
                <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ width:32, height:32, borderRadius:'var(--r-sm)', background:p.ai_severity_score>=8?'var(--danger-bg)':'var(--warning-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:13, color:p.ai_severity_score>=8?'var(--danger)':'var(--warning)', flexShrink:0 }}>
                    {p.ai_severity_score||'?'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:13, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.title}</div>
                    <div style={{ fontSize:11, color:'var(--text-60)' }}><MapPin size={9} style={{ verticalAlign:-1 }}/> {p.village}</div>
                  </div>
                  <StatusBadge status={p.status}/>
                </div>
              ))}
              {!(data?.urgent||[]).length && <EmptyState emoji="✅" title="No urgent issues" description="All problems are under control in your constituency"/>}
            </div>
          </div>
        )}

        {/* Villages list */}
        {tab === 'villages' && (
          <div>
            <SectionHeader title="Village-wise Progress" subtitle={`${data?.villages?.length||0} villages in your constituency — click any to see problems`}/>
            <div className="grid-3" style={{ gap:14 }}>
              {(data?.villages||[]).map((v,i) => (
                <div key={v.name}
                  onClick={() => { setSelVillage(v.name); loadVillageProblems(v.name); setTab('issues'); }}
                  style={{ background:'var(--surface)', borderRadius:'var(--r-xl)', border:`1px solid ${selVillage===v.name?'#10B981':'var(--border)'}`, padding:'16px 18px', cursor:'pointer', transition:'all var(--t-spring)', boxShadow:selVillage===v.name?'0 0 0 3px rgba(16,185,129,0.12)':'var(--shadow-xs)', animation:`fadeInUp 0.4s ease ${i*0.05}s both`, opacity:0 }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='var(--shadow-md)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='var(--shadow-xs)'; }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                    <div style={{ fontWeight:700, fontSize:15, color:'var(--text)' }}>{v.name}</div>
                    <span style={{ fontSize:10, fontWeight:700, color:'#065F46', background:'rgba(16,185,129,0.1)', padding:'2px 8px', borderRadius:'var(--r-full)' }}>
                      {v.population||'—'} pop.
                    </span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:12 }}>
                    {[
                      { label:'Issues',   val:v.problems||0, color:'var(--danger)' },
                      { label:'Resolved', val:v.resolved||0, color:'var(--success)' },
                      { label:'Updates',  val:v.work_updates||0, color:'var(--teal)' },
                    ].map(s => (
                      <div key={s.label} style={{ background:'var(--bg-alt)', borderRadius:'var(--r-sm)', padding:'6px 8px', textAlign:'center' }}>
                        <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:800, color:s.color }}>{s.val}</div>
                        <div style={{ fontSize:9, color:'var(--text-60)', fontWeight:600, textTransform:'uppercase' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width:`${v.problems>0?Math.round((v.resolved/v.problems)*100):0}%`, background:'linear-gradient(90deg,#065F46,#10B981)' }}/>
                  </div>
                  <div style={{ fontSize:10, color:'var(--text-60)', marginTop:5, textAlign:'right' }}>
                    {v.problems>0?Math.round((v.resolved/v.problems)*100):0}% resolved
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budget */}
        {tab === 'budget' && (
          <div>
            <div style={{ background:'linear-gradient(135deg,#065F46,#10B981)', borderRadius:'var(--r-xl)', padding:24, marginBottom:24, color:'#fff' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, marginBottom:4 }}>Allocate Village Budget</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', marginBottom:20 }}>
                Budget received: {formatBudget(s.budget_allocated||0)} · Available: {formatBudget((s.budget_allocated||0)-(s.budget_distributed||0))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:12, alignItems:'flex-end' }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', display:'block', marginBottom:6 }}>Village</label>
                  <select value={allocForm.village} onChange={e => setAllocForm(f => ({ ...f, village:e.target.value }))}
                    style={{ width:'100%', padding:'10px 12px', borderRadius:'var(--r-md)', border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.1)', color:'#fff', fontSize:13, outline:'none' }}>
                    <option value="" style={{ color:'#000' }}>Select village…</option>
                    {(data?.villages||[]).map(v => <option key={v.name} value={v.name} style={{ color:'#000' }}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', display:'block', marginBottom:6 }}>Amount (₹)</label>
                  <input type="number" value={allocForm.amount} onChange={e => setAllocForm(f => ({ ...f, amount:e.target.value }))}
                    placeholder="e.g. 250000"
                    style={{ width:'100%', padding:'10px 12px', borderRadius:'var(--r-md)', border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.1)', color:'#fff', fontSize:13, outline:'none' }}/>
                </div>
                <Button variant="teal" style={{ background:'rgba(0,212,178,0.9)', color:'var(--navy)' }} onClick={allocateBudget} loading={allocBusy}><IndianRupee size={14}/> Allocate</Button>
              </div>
            </div>
            <div className="grid-3" style={{ gap:14 }}>
              {(data?.villageBudgets||[]).map(v => (
                <BudgetCard key={v.village} label={v.village} allocated={v.allocated||0} used={v.used||0} color="#065F46"/>
              ))}
              {!(data?.villageBudgets||[]).length && <EmptyState emoji="💰" title="No budget allocated yet" description="Use the form above to start distributing funds to villages"/>}
            </div>
          </div>
        )}

        {/* Issues */}
        {tab === 'issues' && (
          <div>
            <div style={{ background:'var(--surface)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', padding:20, marginBottom:20, boxShadow:'var(--shadow-sm)' }}>
              <div style={{ display:'flex', alignItems:'flex-end', gap:14, flexWrap:'wrap' }}>
                <div style={{ flex:1, minWidth:180 }}>
                  <label className="input-label">Select Village</label>
                  <select className="input" value={selVillage} onChange={e => loadVillageProblems(e.target.value)}>
                    <option value="">All villages in constituency</option>
                    {(data?.villages||[]).map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                  </select>
                </div>
                <Button variant="navy" onClick={() => selVillage ? loadVillageProblems(selVillage) : null} loading={probLoad}><Filter size={14}/> Load</Button>
              </div>
            </div>
            {probLoad ? <div style={{ textAlign:'center', padding:40 }}><Spinner size={32}/></div> :
             problems.length > 0 ? (
              <div className="table-wrapper" style={{ background:'var(--surface)', borderRadius:'var(--r-xl)' }}>
                <table>
                  <thead><tr><th>Title</th><th>Village</th><th>Category</th><th>Status</th><th>Severity</th><th>Work Updates</th></tr></thead>
                  <tbody>
                    {problems.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight:600, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title}</td>
                        <td style={{ fontSize:12, color:'var(--text-60)' }}>{p.village}</td>
                        <td style={{ fontSize:12, color:'var(--text-60)' }}>{p.category}</td>
                        <td><StatusBadge status={p.status}/></td>
                        <td style={{ fontWeight:700, color:p.ai_severity_score>=8?'var(--danger)':'var(--warning)' }}>{p.ai_severity_score||'—'}</td>
                        <td style={{ color:'var(--teal)', fontWeight:600 }}>{p.work_updates_count||0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState emoji="🏘️" title="Select a village to view its issues" description="Click any village in the Villages tab or use the dropdown above"/>}
          </div>
        )}
      </div>
    </div>
  );
}
