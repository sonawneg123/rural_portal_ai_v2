// src/pages/SarpanchDashboard.js — Village Sarpanch Dashboard
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { getError } from '../utils/api';
import { Button, SectionHeader, StatusBadge, Spinner, EmptyState, ProgressRing } from '../components/ui';
import { formatBudget, timeAgo } from '../utils/helpers';
import { Users, TrendingUp, CheckCircle, Camera, IndianRupee, Bell, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SarpanchDashboard() {
  const { user } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('overview');
  const [statusForm, setStatusForm] = useState({});
  const [updating,   setUpdating]   = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data: d } = await api.get('/sarpanch/dashboard');
      setData(d);
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const updateProblemStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.patch(`/sarpanch/problems/${id}/status`, { status });
      toast.success('Status updated');
      load();
    } catch (err) { toast.error(getError(err)); }
    finally { setUpdating(null); }
  };

  if (loading) return <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center' }}><Spinner size={36}/></div>;

  const s   = data?.summary || {};
  const pct = s.total_problems>0 ? Math.round((s.resolved||0)/s.total_problems*100) : 0;
  const tabs = ['overview','problems','budget'];

  return (
    <div className="page-enter" style={{ background:'var(--bg)', minHeight:'100vh' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#92400E 0%,#F59E0B 100%)', padding:'32px 0 40px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-50, right:-50, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }}/>
        <div className="container" style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
            <div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'var(--r-full)', padding:'4px 12px', fontSize:11, fontWeight:700, color:'#fff', marginBottom:14 }}>
                👤 Sarpanch · {user?.village || 'Village'}
              </div>
              <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(22px,3vw,34px)', fontWeight:900, color:'#fff', letterSpacing:'-0.7px', marginBottom:6 }}>
                {user?.village || 'Village'} Gram Panchayat
              </h1>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.75)' }}>
                {user?.district}, {user?.state}
              </p>
            </div>

            {/* Resolution ring */}
            <div style={{ textAlign:'center' }}>
              <div style={{ position:'relative', width:80, height:80 }}>
                <ProgressRing value={pct} size={80} stroke={6} color="rgba(255,255,255,0.9)"/>
                <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:900, color:'#fff' }}>{pct}%</span>
                </div>
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.75)', marginTop:6 }}>Issues resolved</div>
            </div>
          </div>

          <div style={{ display:'flex', gap:2, marginTop:20, background:'rgba(255,255,255,0.08)', borderRadius:'var(--r-md)', padding:3, width:'fit-content' }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding:'7px 16px', borderRadius:'var(--r-sm)', border:'none', cursor:'pointer', fontSize:13, fontWeight:500, textTransform:'capitalize', transition:'all var(--t-fast)', background:tab===t?'rgba(255,255,255,0.95)':'transparent', color:tab===t?'#92400E':'rgba(255,255,255,0.75)' }}>
                {t === 'budget' ? '💰 Budget' : t === 'problems' ? '📋 Problems' : '📊 Overview'}
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
                { label:'Total Issues',  val:s.total_problems||0, color:'#F59E0B', icon:<TrendingUp size={18}/> },
                { label:'Pending',       val:s.pending||0,        color:'var(--danger)', icon:<Bell size={18}/> },
                { label:'Resolved',      val:s.resolved||0,       color:'var(--success)', icon:<CheckCircle size={18}/> },
                { label:'Work Updates',  val:s.work_updates||0,   color:'var(--teal)', icon:<Camera size={18}/> },
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

            {/* Budget card */}
            <div style={{ background:'linear-gradient(135deg,#92400E,#F59E0B)', borderRadius:'var(--r-xl)', padding:'18px 24px', marginBottom:24, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, color:'#fff' }}>
              {[
                { label:'Budget received',  val:formatBudget(s.budget_allocated||0) },
                { label:'Amount spent',     val:formatBudget(s.budget_used||0) },
                { label:'Balance',          val:formatBudget((s.budget_allocated||0)-(s.budget_used||0)) },
              ].map(b => (
                <div key={b.label} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', marginBottom:4 }}>{b.label}</div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:900 }}>{b.val}</div>
                </div>
              ))}
            </div>

            {/* Recent problems */}
            <div style={{ background:'var(--surface)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', padding:20, boxShadow:'var(--shadow-sm)' }}>
              <SectionHeader title="Village Problems" subtitle="Latest reported issues in your panchayat" action={<Link to="/problems" className="btn btn-ghost btn-sm">View all <ChevronRight size={13}/></Link>}/>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {(data?.recentProblems||[]).map(p => (
                  <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'var(--bg-alt)', borderRadius:'var(--r-md)', border:'1px solid var(--border)' }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', flexShrink:0, background:p.ai_severity_score>=8?'var(--danger)':p.ai_severity_score>=5?'var(--warning)':'var(--success)' }}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:600, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title}</div>
                      <div style={{ fontSize:11, color:'var(--text-60)' }}>{timeAgo(p.created_at)} · {p.work_updates_count||0} work updates</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <StatusBadge status={p.status}/>
                      {p.status !== 'resolved' && (
                        <Button size="sm" variant="teal"
                          loading={updating===p.id}
                          onClick={() => updateProblemStatus(p.id, 'in_progress')}>
                          Update
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {!(data?.recentProblems||[]).length && <EmptyState emoji="🌿" title="No problems reported yet" description="Encourage citizens to use the portal to report issues in your village"/>}
              </div>
            </div>
          </div>
        )}

        {/* All problems */}
        {tab === 'problems' && (
          <div>
            <SectionHeader title="All Village Problems" subtitle={`${s.total_problems||0} total issues in ${user?.village}`}/>
            <div className="table-wrapper" style={{ background:'var(--surface)', borderRadius:'var(--r-xl)' }}>
              <table>
                <thead><tr><th>Title</th><th>Category</th><th>Reporter</th><th>Status</th><th>Severity</th><th>Work</th><th>Action</th></tr></thead>
                <tbody>
                  {(data?.allProblems||[]).map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight:600, maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title}</td>
                      <td style={{ fontSize:12, color:'var(--text-60)' }}>{p.category}</td>
                      <td style={{ fontSize:12, color:'var(--text-60)' }}>{p.reporter_name}</td>
                      <td><StatusBadge status={p.status}/></td>
                      <td style={{ fontWeight:700, color:p.ai_severity_score>=8?'var(--danger)':'var(--warning)' }}>{p.ai_severity_score||'—'}</td>
                      <td style={{ color:'var(--teal)', fontWeight:600 }}>{p.work_updates_count||0}</td>
                      <td>
                        <select onChange={e => e.target.value && updateProblemStatus(p.id, e.target.value)}
                          defaultValue=""
                          style={{ padding:'4px 8px', borderRadius:'var(--r-sm)', border:'1px solid var(--border-dark)', fontSize:11, background:'var(--surface)', color:'var(--text)', outline:'none' }}>
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
          </div>
        )}

        {/* Budget */}
        {tab === 'budget' && (
          <div>
            <div style={{ background:'linear-gradient(135deg,#92400E,#F59E0B)', borderRadius:'var(--r-xl)', padding:24, marginBottom:24, color:'#fff' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, marginBottom:4 }}>Panchayat Budget</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.75)', marginBottom:20 }}>
                Allocated by MLA · Track expenditure per project below
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
                {[
                  { label:'Total budget',  val:formatBudget(s.budget_allocated||0) },
                  { label:'Spent',         val:formatBudget(s.budget_used||0) },
                  { label:'Remaining',     val:formatBudget((s.budget_allocated||0)-(s.budget_used||0)) },
                ].map(b => (
                  <div key={b.label} style={{ background:'rgba(255,255,255,0.1)', borderRadius:'var(--r-md)', padding:'12px 14px', textAlign:'center' }}>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', marginBottom:4 }}>{b.label}</div>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800 }}>{b.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'rgba(255,255,255,0.7)', marginBottom:6 }}>
                  <span>Budget utilisation</span>
                  <span>{s.budget_allocated>0?Math.round((s.budget_used||0)/s.budget_allocated*100):0}%</span>
                </div>
                <div style={{ height:8, background:'rgba(255,255,255,0.15)', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${s.budget_allocated>0?Math.round((s.budget_used||0)/s.budget_allocated*100):0}%`, background:'rgba(255,255,255,0.8)', borderRadius:4, transition:'width 1.2s ease' }}/>
                </div>
              </div>
            </div>

            {/* Project-wise breakdown */}
            <SectionHeader title="Project-wise Expenditure"/>
            <div style={{ background:'var(--surface)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', overflow:'hidden', boxShadow:'var(--shadow-sm)' }}>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Problem / Project</th><th>Category</th><th>Allocated</th><th>Status</th></tr></thead>
                  <tbody>
                    {(data?.budgetBreakdown||[]).map((b,i) => (
                      <tr key={i}>
                        <td style={{ fontWeight:600 }}>{b.title}</td>
                        <td style={{ fontSize:12, color:'var(--text-60)' }}>{b.category}</td>
                        <td style={{ fontWeight:700, color:'var(--success)' }}>{formatBudget(b.budget_estimate||0)}</td>
                        <td><StatusBadge status={b.status}/></td>
                      </tr>
                    ))}
                    {!(data?.budgetBreakdown||[]).length && (
                      <tr><td colSpan={4} style={{ textAlign:'center', padding:40, color:'var(--text-60)' }}>No budget data yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
