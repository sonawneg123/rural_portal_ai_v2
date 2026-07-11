// src/pages/MPDashboard.js — Feature 4: MP Dashboard
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { getError } from '../utils/api';
import { Button, SectionHeader, BudgetCard, StatusBadge, Spinner, EmptyState } from '../components/ui';
import { formatBudget } from '../utils/helpers';
import { IndianRupee, Filter, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MPDashboard() {
  const { user } = useAuth();
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('overview');
  const [selDist,   setSelDist]   = useState('');
  const [selTaluka, setSelTaluka] = useState('');
  const [problems,  setProblems]  = useState([]);
  const [probLoad,  setProbLoad]  = useState(false);
  const [allocForm, setAllocForm] = useState({ mla: '', amount: '' });
  const [allocBusy, setAllocBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data: d } = await api.get('/mp/dashboard');
      setData(d);
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filterProblems = async () => {
    setProbLoad(true);
    try {
      const params = new URLSearchParams({ state: user?.state || '' });
      if (selDist)   params.append('district', selDist);
      if (selTaluka) params.append('taluka',   selTaluka);
      const { data: d } = await api.get(`/problems?${params}`);
      setProblems(d.data || []);
    } catch (err) { toast.error(getError(err)); }
    finally { setProbLoad(false); }
  };

  const allocateBudget = async () => {
    if (!allocForm.mla || !allocForm.amount) { toast.error('Select MLA constituency and enter amount'); return; }
    setAllocBusy(true);
    try {
      await api.post('/mp/budget/allocate', { taluka: allocForm.mla, amount: Number(allocForm.amount) });
      toast.success(`Budget allocated to ${allocForm.mla} constituency`);
      setAllocForm({ mla: '', amount: '' });
      load();
    } catch (err) { toast.error(getError(err)); }
    finally { setAllocBusy(false); }
  };

  if (loading) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={36}/></div>;

  const s = data?.summary || {};
  const tabs = ['overview', 'budget', 'issues'];

  return (
    <div className="page-enter" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)', padding: '32px 0 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }}/>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 'var(--r-full)', padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#fff', marginBottom: 14 }}>
            🇮🇳 MP · {user?.constituency || user?.district || 'Constituency'}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,3vw,36px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.8px', marginBottom: 6 }}>
            Parliamentary Constituency
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 20 }}>Multi-district overview · Budget allocation to MLA constituencies</p>
          <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 'var(--r-md)', padding: 3, width: 'fit-content', flexWrap: 'wrap' }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: '7px 16px', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all var(--t-fast)', background: tab === t ? 'rgba(255,255,255,0.95)' : 'transparent', color: tab === t ? '#1D4ED8' : 'rgba(255,255,255,0.75)', textTransform: 'capitalize' }}>
                {t === 'budget' ? '💰 Budget' : t === 'issues' ? '📋 Issues' : '📊 Overview'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28, paddingBottom: 60 }}>
        {tab === 'overview' && (
          <div>
            <div className="grid-4" style={{ marginBottom: 24 }}>
              {[
                { label: 'Total Issues',  val: s.total_problems || 0, color: 'var(--danger)',  icon: <AlertTriangle size={20}/> },
                { label: 'Pending',       val: s.pending || 0,        color: 'var(--warning)', icon: <TrendingUp size={20}/> },
                { label: 'Resolved',      val: s.resolved || 0,       color: 'var(--success)', icon: <CheckCircle size={20}/> },
                { label: 'Budget Issued', val: formatBudget(s.budget_allocated || 0), color: '#1D4ED8', icon: <IndianRupee size={20}/> },
              ].map((c, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', padding: 18, boxShadow: 'var(--shadow-sm)', animation: `fadeInUp 0.4s ease ${i * 0.07}s both`, opacity: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 'var(--r-md)', background: `${c.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color }}>{c.icon}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-40)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{c.label}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, color: 'var(--text)' }}>{c.val}</div>
                </div>
              ))}
            </div>
            <div className="grid-3" style={{ gap: 14 }}>
              {(data?.byDistrict || []).map((d, i) => (
                <div key={d.district} style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', padding: 18, boxShadow: 'var(--shadow-sm)', animation: `fadeInUp 0.4s ease ${i * 0.06}s both`, opacity: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: 'var(--text)' }}>{d.district}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ background: 'var(--danger-bg)', borderRadius: 'var(--r-md)', padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--danger)' }}>{d.count || 0}</div>
                      <div style={{ fontSize: 9, color: 'var(--danger)', fontWeight: 700, textTransform: 'uppercase' }}>Issues</div>
                    </div>
                    <div style={{ background: 'var(--success-bg)', borderRadius: 'var(--r-md)', padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--success)' }}>{d.resolved || 0}</div>
                      <div style={{ fontSize: 9, color: 'var(--success)', fontWeight: 700, textTransform: 'uppercase' }}>Resolved</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${d.count > 0 ? Math.round((d.resolved / d.count) * 100) : 0}%`, background: 'linear-gradient(90deg,#1D4ED8,#3B82F6)' }}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'budget' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)', borderRadius: 'var(--r-xl)', padding: 24, marginBottom: 24, color: '#fff' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Allocate to MLA Constituency</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 20 }}>Total budget: {formatBudget(s.budget_allocated || 0)}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>MLA Constituency</label>
                  <select value={allocForm.mla} onChange={e => setAllocForm(f => ({ ...f, mla: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--r-md)', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, outline: 'none' }}>
                    <option value="" style={{ color: '#000' }}>Select constituency…</option>
                    {(data?.constituencies || []).map(c => <option key={c} value={c} style={{ color: '#000' }}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>Amount (₹)</label>
                  <input type="number" value={allocForm.amount} onChange={e => setAllocForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="e.g. 10000000" style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--r-md)', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, outline: 'none' }}/>
                </div>
                <Button variant="teal" onClick={allocateBudget} loading={allocBusy}><IndianRupee size={14}/> Allocate</Button>
              </div>
            </div>
            <div className="grid-3" style={{ gap: 14 }}>
              {(data?.constituencies || []).map(c => (
                <BudgetCard key={c} label={c} allocated={0} used={0} color="#1D4ED8"/>
              ))}
              {!(data?.constituencies || []).length && <EmptyState emoji="🏘️" title="No constituency data" description="Budget allocations will appear here"/>}
            </div>
          </div>
        )}

        {tab === 'issues' && (
          <div>
            <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', padding: 20, marginBottom: 20, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, alignItems: 'flex-end' }}>
                <div>
                  <label className="input-label">District</label>
                  <select className="input" value={selDist} onChange={e => { setSelDist(e.target.value); setSelTaluka(''); }}>
                    <option value="">All districts</option>
                    {(data?.districts || []).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Taluka</label>
                  <select className="input" value={selTaluka} onChange={e => setSelTaluka(e.target.value)}>
                    <option value="">All talukas</option>
                    {(data?.talukas || []).filter(t => !selDist || t.district === selDist).map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <Button variant="navy" onClick={filterProblems} loading={probLoad}><Filter size={14}/> Filter</Button>
              </div>
            </div>
            {probLoad ? <div style={{ textAlign: 'center', padding: 40 }}><Spinner size={32}/></div> :
              problems.length > 0 ? (
                <div className="table-wrapper" style={{ background: '#fff', borderRadius: 'var(--r-xl)' }}>
                  <table>
                    <thead><tr><th>Title</th><th>District</th><th>Taluka</th><th>Status</th><th>Severity</th><th>Upvotes</th></tr></thead>
                    <tbody>
                      {problems.map(p => (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</td>
                          <td style={{ fontSize: 12, color: 'var(--text-60)' }}>{p.district}</td>
                          <td style={{ fontSize: 12, color: 'var(--text-60)' }}>{p.taluka || '—'}</td>
                          <td><StatusBadge status={p.status}/></td>
                          <td style={{ fontWeight: 700, color: p.ai_severity_score >= 8 ? 'var(--danger)' : 'var(--warning)' }}>{p.ai_severity_score || '—'}</td>
                          <td>{p.upvotes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <EmptyState emoji="🔍" title="Apply filters to explore" description="Select a district or taluka to see issues in your constituency"/>}
          </div>
        )}
      </div>
    </div>
  );
}
