// src/pages/GramSevakDashboard.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { getError } from '../utils/api';
import { Button, SectionHeader, StatusBadge, Spinner, EmptyState, AIChip } from '../components/ui';
import { timeAgo } from '../utils/helpers';
import { Camera, CheckCircle, TrendingUp, Sparkles, ChevronRight, MapPin, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GramSevakDashboard() {
  const { user } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('pending');

  const load = async () => {
    setLoading(true);
    try {
      const { data: d } = await api.get('/gramsevak/dashboard');
      setData(d);
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center' }}><Spinner size={36}/></div>;

  const s    = data?.summary || {};
  const tabs = ['pending','in_progress','resolved'];

  const filtered = (data?.problems||[]).filter(p =>
    tab === 'pending'     ? p.status === 'pending'      :
    tab === 'in_progress' ? p.status === 'in_progress'  : p.status === 'resolved'
  );

  return (
    <div className="page-enter" style={{ background:'var(--bg)', minHeight:'100vh' }}>
      <div style={{ background:'linear-gradient(135deg,#064E3B,#10B981)', padding:'32px 0 40px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }}/>
        <div className="container" style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'var(--r-full)', padding:'4px 12px', fontSize:11, fontWeight:700, color:'#fff', marginBottom:14 }}>
            📋 Gram Sevak · {user?.village || 'Village'}
          </div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(22px,3vw,34px)', fontWeight:900, color:'#fff', letterSpacing:'-0.7px', marginBottom:6 }}>Field Operations</h1>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.7)', marginBottom:20 }}>Track and verify work progress across all village problems</p>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:12, marginBottom:20 }}>
            {[
              { label:'Pending',     val:s.pending||0,     color:'#FEF3C7', tc:'#92400E' },
              { label:'In Progress', val:s.in_progress||0, color:'#EDE9FE', tc:'#5B21B6' },
              { label:'Resolved',    val:s.resolved||0,    color:'#ECFDF5', tc:'#065F46' },
              { label:'Work Updates',val:s.work_updates||0,color:'rgba(255,255,255,0.12)', tc:'#fff' },
            ].map((c,i) => (
              <div key={i} style={{ background:c.color, borderRadius:'var(--r-lg)', padding:'14px 16px', textAlign:'center' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:900, color:c.tc }}>{c.val}</div>
                <div style={{ fontSize:10, fontWeight:700, color:c.tc, opacity:0.75, textTransform:'uppercase', letterSpacing:0.4, marginTop:3 }}>{c.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', gap:2, background:'rgba(255,255,255,0.08)', borderRadius:'var(--r-md)', padding:3, width:'fit-content' }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding:'6px 14px', borderRadius:'var(--r-sm)', border:'none', cursor:'pointer', fontSize:13, fontWeight:500, transition:'all var(--t-fast)', background:tab===t?'rgba(255,255,255,0.95)':'transparent', color:tab===t?'#064E3B':'rgba(255,255,255,0.75)', textTransform:'capitalize' }}>
                {t.replace('_',' ')} ({(data?.problems||[]).filter(p => p.status===t).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop:24, paddingBottom:60 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {filtered.map((p,i) => (
            <div key={p.id} style={{ background:'var(--surface)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', padding:'16px 18px', boxShadow:'var(--shadow-sm)', animation:`fadeInUp 0.35s ease ${i*0.05}s both`, opacity:0 }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:14, flexWrap:'wrap' }}>
                <div style={{ width:42, height:42, borderRadius:'var(--r-md)', background:p.ai_severity_score>=8?'var(--danger-bg)':p.ai_severity_score>=5?'var(--warning-bg)':'var(--success-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontWeight:900, fontSize:15, color:p.ai_severity_score>=8?'var(--danger)':p.ai_severity_score>=5?'var(--warning)':'var(--success)', flexShrink:0 }}>
                  {p.ai_severity_score||'?'}
                </div>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{p.title}</div>
                  <div style={{ fontSize:12, color:'var(--text-60)', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                    <span><MapPin size={11} style={{ verticalAlign:-1 }}/> {p.village}</span>
                    <span>{p.category}</span>
                    <span>{timeAgo(p.created_at)}</span>
                  </div>
                  {p.ai_summary && (
                    <div style={{ marginTop:8, background:'var(--bg-alt)', borderRadius:'var(--r-md)', padding:'8px 10px', fontSize:12, color:'var(--text-60)', display:'flex', gap:6 }}>
                      <Sparkles size={12} color="var(--purple)" style={{ flexShrink:0, marginTop:1 }}/>
                      <span style={{ fontStyle:'italic' }}>{p.ai_summary.slice(0,100)}…</span>
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end' }}>
                  <StatusBadge status={p.status}/>
                  <div style={{ display:'flex', gap:8 }}>
                    <Link to={`/problems/${p.id}/work-progress`} className="btn btn-teal btn-sm" style={{ background:'var(--teal)', color:'var(--navy)' }}>
                      <Camera size={13}/> Add Update
                    </Link>
                    <Link to={`/problems/${p.id}`} className="btn btn-ghost btn-sm">
                      <FileText size={13}/> View
                    </Link>
                  </div>
                </div>
              </div>

              {/* Work updates summary */}
              {p.work_updates_count > 0 && (
                <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
                  <Camera size={13} color="var(--teal)"/>
                  <span style={{ fontSize:12, color:'var(--text-60)' }}>{p.work_updates_count} work update{p.work_updates_count!==1?'s':''}</span>
                  {p.avg_work_completion && (
                    <>
                      <span style={{ color:'var(--border-dark)' }}>·</span>
                      <span style={{ fontSize:12, color:'var(--success)', fontWeight:600 }}>~{Math.round(p.avg_work_completion)}% complete (AI estimate)</span>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <EmptyState
              emoji={tab==='resolved'?'✅':'📋'}
              title={tab==='resolved'?'No resolved problems yet':'No problems in this category'}
              description="Problems reported by citizens will appear here for you to track and update"
            />
          )}
        </div>
      </div>
    </div>
  );
}
