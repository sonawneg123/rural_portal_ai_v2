// src/pages/ProfilePage.js — Feature 2: Citizen Profile + Feature 3: My Problems
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getError } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Button, StatusBadge, SeverityBadge, Spinner, EmptyState, RoleBadge } from '../components/ui';
import { timeAgo, formatDate, INDIA_STATES } from '../utils/helpers';
import { User, Lock, FileText, TrendingUp, CheckCircle, Eye, ThumbsUp, Edit2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

function StatPill({ icon, label, value, color }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '14px 16px', textAlign: 'center', boxShadow: 'var(--shadow-xs)' }}>
      <div style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, color: 'var(--text)', marginBottom: 3 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-60)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [tab,      setTab]      = useState('profile');
  const [editing,  setEditing]  = useState(false);
  const [form,     setForm]     = useState({});
  const [pwForm,   setPwForm]   = useState({ current: '', newPw: '', confirm: '' });
  const [saving,   setSaving]   = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [stats,    setStats]    = useState(null);
  const [problems, setProblems] = useState([]);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name, phone: user.phone || '', district: user.district, village: user.village, state: user.state });
  }, [user]);

  useEffect(() => {
    if (tab === 'problems') loadProblems();
    if (tab === 'profile')  loadStats();
  }, [tab]);

  const loadStats = async () => {
    try {
      const { data } = await api.get('/auth/my-stats');
      setStats(data);
    } catch { /* silent */ }
  };

  const loadProblems = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/problems/my');
      setProblems(data.data || []);
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.patch('/auth/profile', form);
      await refreshUser();
      toast.success('Profile updated');
      setEditing(false);
    } catch (err) { toast.error(getError(err)); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (pwForm.newPw !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    if (pwForm.newPw.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setPwSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword: pwForm.current, newPassword: pwForm.newPw });
      toast.success('Password changed successfully');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) { toast.error(getError(err)); }
    finally { setPwSaving(false); }
  };

  const inp = { width: '100%', padding: '10px 13px', border: '1.5px solid var(--border-dark)', borderRadius: 'var(--r-md)', fontSize: 14, color: 'var(--text)', outline: 'none', fontFamily: 'var(--font-body)', background: '#fff', boxSizing: 'border-box', transition: 'border-color 0.15s' };

  return (
    <div className="page-enter" style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--navy), var(--navy-light))', padding: '36px 0 52px' }}>
        <div className="container-sm" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--teal), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 28, color: '#fff', flexShrink: 0, animation: 'float 3s ease-in-out infinite' }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', marginBottom: 6 }}>{user?.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <RoleBadge role={user?.role || 'user'}/>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{user?.village}, {user?.district}</span>
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div className="container-sm" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 'var(--r-md)', padding: 3, width: 'fit-content' }}>
            {[{ id: 'profile', label: '👤 Profile' }, { id: 'problems', label: '📋 My Reports' }, { id: 'security', label: '🔒 Security' }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ padding: '7px 16px', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all var(--t-fast)', background: tab === t.id ? 'rgba(255,255,255,0.95)' : 'transparent', color: tab === t.id ? 'var(--navy)' : 'rgba(255,255,255,0.75)' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-sm" style={{ marginTop: -24, position: 'relative', zIndex: 2 }}>

        {/* ── Profile tab ── */}
        {tab === 'profile' && (
          <div>
            {/* Stats */}
            {stats && (
              <div className="grid-4" style={{ gap: 12, marginBottom: 20 }}>
                <StatPill icon={<FileText size={18}/>}   label="Reports"  value={stats.total_problems || 0}  color="var(--navy)"/>
                <StatPill icon={<CheckCircle size={18}/>} label="Resolved" value={stats.resolved || 0}        color="var(--success)"/>
                <StatPill icon={<ThumbsUp size={18}/>}   label="Upvotes"  value={stats.total_upvotes || 0}   color="var(--purple)"/>
                <StatPill icon={<Eye size={18}/>}        label="Views"    value={stats.total_views || 0}     color="var(--teal)"/>
              </div>
            )}

            <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Personal Information</h2>
                {!editing ? (
                  <Button size="sm" variant="ghost" onClick={() => setEditing(true)}><Edit2 size={13}/> Edit</Button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><X size={13}/> Cancel</Button>
                    <Button size="sm" variant="navy" onClick={saveProfile} loading={saving}><Save size={13}/> Save</Button>
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Full Name',    key: 'name',     type: 'text' },
                  { label: 'Phone',        key: 'phone',    type: 'tel' },
                  { label: 'Village',      key: 'village',  type: 'text' },
                  { label: 'District',     key: 'district', type: 'text' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-60)', marginBottom: 5 }}>{f.label}</label>
                    {editing ? (
                      <input type={f.type} value={form[f.key] || ''} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                        style={inp} onFocus={e => e.target.style.borderColor = 'var(--navy)'} onBlur={e => e.target.style.borderColor = 'var(--border-dark)'}/>
                    ) : (
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', padding: '10px 0' }}>{form[f.key] || '—'}</div>
                    )}
                  </div>
                ))}
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-60)', marginBottom: 5 }}>State</label>
                  {editing ? (
                    <select value={form.state || ''} onChange={e => setForm(x => ({ ...x, state: e.target.value }))} style={{ ...inp }}>
                      {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', padding: '10px 0' }}>{form.state || '—'}</div>
                  )}
                </div>
              </div>
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <div><span style={{ fontSize: 12, color: 'var(--text-60)' }}>Email</span><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{user?.email}</div></div>
                  <div><span style={{ fontSize: 12, color: 'var(--text-60)' }}>Member since</span><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{formatDate(user?.created_at)}</div></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── My Reports tab ── */}
        {tab === 'problems' && (
          <div>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32}/></div>
            ) : problems.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                <EmptyState emoji="📋" title="No reports yet" description="When you report a problem, it will appear here with its full status history."
                  action={<Link to="/report" className="btn btn-navy btn-sm">Report a Problem</Link>}/>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {problems.map((p, i) => (
                  <Link key={p.id} to={`/problems/${p.id}`}
                    style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', padding: '16px 18px', textDecoration: 'none', display: 'block', boxShadow: 'var(--shadow-xs)', transition: 'all var(--t-spring)', animation: `fadeInUp 0.35s ease ${i * 0.05}s both`, opacity: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>{p.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-60)' }}>{p.category} · {timeAgo(p.created_at)}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <StatusBadge status={p.status}/>
                        {p.ai_severity_score && <SeverityBadge score={p.ai_severity_score}/>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                      {[
                        { icon: <ThumbsUp size={12}/>, val: p.upvotes },
                        { icon: <Eye size={12}/>,      val: p.views },
                        { icon: <TrendingUp size={12}/>, val: `${p.work_updates_count || 0} updates` },
                      ].map((s, j) => (
                        <span key={j} style={{ fontSize: 12, color: 'var(--text-60)', display: 'flex', alignItems: 'center', gap: 4 }}>{s.icon}{s.val}</span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Security tab ── */}
        {tab === 'security' && (
          <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>Change Password</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400 }}>
              {[
                { label: 'Current password', key: 'current', value: pwForm.current },
                { label: 'New password',     key: 'newPw',   value: pwForm.newPw },
                { label: 'Confirm new',      key: 'confirm', value: pwForm.confirm },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-60)', marginBottom: 5 }}>{f.label}</label>
                  <input type="password" value={f.value} onChange={e => setPwForm(x => ({ ...x, [f.key]: e.target.value }))}
                    style={inp} onFocus={e => e.target.style.borderColor = 'var(--navy)'} onBlur={e => e.target.style.borderColor = 'var(--border-dark)'}/>
                </div>
              ))}
              <Button variant="navy" onClick={changePassword} loading={pwSaving} style={{ width: 'fit-content' }}>
                <Lock size={14}/> Update Password
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
