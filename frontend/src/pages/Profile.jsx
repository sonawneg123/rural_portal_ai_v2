import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Lock, FileText, TrendingUp, CheckCircle, Eye, ThumbsUp, Edit2, Save, X } from 'lucide-react';
import { authApi } from '../api/auth.js';
import { problemsApi } from '../api/problems.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getError } from '../api/client.js';
import { PageSpinner } from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { StatusBadge, SeverityBadge, RoleBadge } from '../components/ui/Badge.jsx';
import { timeAgo, formatDate, INDIA_STATES } from '../utils/helpers.js';

function StatPill({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-3.5 text-center">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2.5" style={{ background: `${color}18`, color }}>
        <Icon className="w-[18px] h-[18px]" />
      </div>
      <div className="font-display text-2xl font-extrabold text-ink dark:text-slate-100 mb-0.5">{value}</div>
      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</div>
    </div>
  );
}

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name, phone: user.phone || '', district: user.district, village: user.village, state: user.state });
  }, [user]);

  const { data: stats } = useQuery({
    queryKey: ['my-stats'], queryFn: () => authApi.getMyStats().then(r => r.data), enabled: tab === 'profile',
  });
  const { data: problemsData, isLoading: probLoading } = useQuery({
    queryKey: ['my-problems'], queryFn: () => problemsApi.getMy().then(r => r.data), enabled: tab === 'problems',
  });
  const problems = problemsData?.data || [];

  const saveProfile = async () => {
    setSaving(true);
    try {
      await authApi.updateProfile(form);
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
      await authApi.changePassword({ currentPassword: pwForm.current, newPassword: pwForm.newPw });
      toast.success('Password changed successfully');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) { toast.error(getError(err)); }
    finally { setPwSaving(false); }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-16">
      <div className="bg-gradient-to-br from-navy to-navy-light py-9">
        <div className="container-custom max-w-2xl flex items-center gap-5">
          <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-teal to-purple flex items-center justify-center font-display font-extrabold text-3xl text-white flex-shrink-0 animate-float">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-white tracking-tight mb-1.5">{user?.name}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <RoleBadge role={user?.role || 'user'} />
              <span className="text-xs text-white/60">{user?.village}, {user?.district}</span>
            </div>
          </div>
        </div>
        <div className="container-custom max-w-2xl mt-5">
          <div className="flex gap-0.5 bg-white/10 rounded-xl p-0.5 w-fit">
            {[{ id: 'profile', label: '👤 Profile' }, { id: 'problems', label: '📋 My Reports' }, { id: 'security', label: '🔒 Security' }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${tab === t.id ? 'bg-white text-navy' : 'text-white/75'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-custom max-w-2xl -mt-6 relative z-10">
        {tab === 'profile' && (
          <div>
            {stats && (
              <div className="grid grid-cols-4 gap-3 mb-5">
                <StatPill icon={FileText}    label="Reports"  value={stats.total_problems || 0} color="#0A2540" />
                <StatPill icon={CheckCircle} label="Resolved" value={stats.resolved || 0}       color="#10B981" />
                <StatPill icon={ThumbsUp}    label="Upvotes"  value={stats.total_upvotes || 0}  color="#635BFF" />
                <StatPill icon={Eye}         label="Views"    value={stats.total_views || 0}    color="#00D4B2" />
              </div>
            )}

            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-lg font-bold text-ink dark:text-slate-100">Personal Information</h2>
                {!editing ? (
                  <button onClick={() => setEditing(true)} className="btn btn-ghost btn-sm"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(false)} className="btn btn-ghost btn-sm"><X className="w-3.5 h-3.5" /> Cancel</button>
                    <button onClick={saveProfile} disabled={saving} className="btn btn-navy btn-sm"><Save className="w-3.5 h-3.5" /> Save</button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[{ label: 'Full Name', key: 'name' }, { label: 'Phone', key: 'phone' }, { label: 'Village', key: 'village' }, { label: 'District', key: 'district' }].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">{f.label}</label>
                    {editing ? (
                      <input value={form[f.key] || ''} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))} className="input" />
                    ) : (
                      <div className="text-sm font-medium text-ink dark:text-slate-200 py-2.5">{form[f.key] || '—'}</div>
                    )}
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">State</label>
                  {editing ? (
                    <select value={form.state || ''} onChange={e => setForm(x => ({ ...x, state: e.target.value }))} className="input">
                      {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <div className="text-sm font-medium text-ink dark:text-slate-200 py-2.5">{form.state || '—'}</div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700 flex gap-6 flex-wrap">
                <div><span className="text-xs text-slate-400">Email</span><div className="text-sm font-medium mt-0.5">{user?.email}</div></div>
                <div><span className="text-xs text-slate-400">Member since</span><div className="text-sm font-medium mt-0.5">{formatDate(user?.created_at)}</div></div>
              </div>
            </div>
          </div>
        )}

        {tab === 'problems' && (
          probLoading ? <PageSpinner /> : problems.length === 0 ? (
            <div className="card p-5">
              <EmptyState emoji="📋" title="No reports yet" description="When you report a problem, it will appear here with its full status history."
                action={<Link to="/report" className="btn btn-navy btn-sm">Report a Problem</Link>} />
            </div>
          ) : (
            <div className="space-y-3">
              {problems.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link to={`/problems/${p.id}`} className="card p-4 block no-underline hover:-translate-y-0.5 transition-transform">
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex-1">
                        <div className="font-bold text-[15px] text-ink dark:text-slate-100 mb-1">{p.title}</div>
                        <div className="text-xs text-slate-400">{p.category} · {timeAgo(p.created_at)}</div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <StatusBadge status={p.status} />
                        {p.ai_severity_score && <SeverityBadge score={p.ai_severity_score} />}
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-xs text-slate-500 flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{p.upvotes}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1"><Eye className="w-3 h-3" />{p.views}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1"><TrendingUp className="w-3 h-3" />{p.work_updates_count || 0} updates</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )
        )}

        {tab === 'security' && (
          <div className="card p-6">
            <h2 className="font-display text-lg font-bold text-ink dark:text-slate-100 mb-5">Change Password</h2>
            <div className="space-y-3.5 max-w-sm">
              {[{ label: 'Current password', key: 'current' }, { label: 'New password', key: 'newPw' }, { label: 'Confirm new', key: 'confirm' }].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">{f.label}</label>
                  <input type="password" value={pwForm[f.key]} onChange={e => setPwForm(x => ({ ...x, [f.key]: e.target.value }))} className="input" />
                </div>
              ))}
              <button onClick={changePassword} disabled={pwSaving} className="btn btn-navy w-fit">
                <Lock className="w-3.5 h-3.5" /> Update Password
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
