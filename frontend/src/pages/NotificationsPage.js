// src/pages/NotificationsPage.js
// Feature 1: Smart Notification Centre — grouped, filterable, mark all read
import React, { useEffect, useState, useCallback } from 'react';
import api, { getError } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Button, EmptyState, Spinner } from '../components/ui';
import { timeAgo } from '../utils/helpers';
import { Bell, CheckCircle, AlertTriangle, Camera, ThumbsUp, Sparkles, Trash2, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const TYPE_CONFIG = {
  status_change: { icon: <CheckCircle size={16}/>, color: 'var(--success)',  bg: 'var(--success-bg)',  label: 'Status' },
  comment:       { icon: <Bell size={16}/>,         color: 'var(--info)',     bg: 'var(--info-bg)',     label: 'Comment' },
  work_update:   { icon: <Camera size={16}/>,       color: 'var(--purple)',   bg: 'var(--purple-glow)', label: 'Work' },
  upvote:        { icon: <ThumbsUp size={16}/>,     color: 'var(--warning)',  bg: 'var(--warning-bg)',  label: 'Upvote' },
  system:        { icon: <Sparkles size={16}/>,     color: 'var(--navy)',     bg: 'var(--bg-alt)',      label: 'System' },
};
const FILTERS = ['all','status_change','comment','work_update','upvote','system'];

export default function NotificationsPage() {
  const { setNotifCount } = useAuth();
  const [notifs,   setNotifs]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications?limit=100');
      setNotifs(data.data || []);
      setNotifCount(0);
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  }, [setNotifCount]);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {});
    setNotifs(n => n.map(x => x.id === id ? { ...x, is_read: true } : x));
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.patch('/notifications/read-all');
      setNotifs(n => n.map(x => ({ ...x, is_read: true })));
      setNotifCount(0);
      toast.success('All notifications marked as read');
    } catch (err) { toast.error(getError(err)); }
    finally { setMarkingAll(false); }
  };

  const visible  = filter === 'all' ? notifs : notifs.filter(n => n.type === filter);
  const unreadCt = notifs.filter(n => !n.is_read).length;

  return (
    <div className="page-enter" style={{ background: 'var(--bg)', minHeight: '100vh', padding: '0 0 60px' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--navy), var(--navy-light))', padding: '32px 0 48px' }}>
        <div className="container-sm">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.6px', marginBottom: 4 }}>
                Notifications
              </h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                {unreadCt > 0 ? `${unreadCt} unread` : 'All caught up'}
              </p>
            </div>
            {unreadCt > 0 && (
              <Button variant="teal" size="sm" onClick={markAllRead} loading={markingAll}>
                <Check size={14}/> Mark all read
              </Button>
            )}
          </div>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 4, marginTop: 20, flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: '6px 14px', borderRadius: 'var(--r-full)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, textTransform: 'capitalize', transition: 'all var(--t-fast)', background: filter === f ? '#fff' : 'rgba(255,255,255,0.12)', color: filter === f ? 'var(--navy)' : 'rgba(255,255,255,0.75)' }}>
                {f === 'all' ? `All (${notifs.length})` : TYPE_CONFIG[f]?.label + ` (${notifs.filter(n => n.type === f).length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-sm" style={{ marginTop: -20, position: 'relative', zIndex: 2 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32}/></div>
        ) : visible.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <EmptyState emoji="🔔" title="No notifications" description="You'll see updates here when your reports change status or get comments"/>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visible.map((n, i) => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
              return (
                <div key={n.id} onClick={() => !n.is_read && markRead(n.id)}
                  style={{
                    background: n.is_read ? '#fff' : `${cfg.bg}`,
                    border: `1px solid ${n.is_read ? 'var(--border)' : cfg.color + '33'}`,
                    borderRadius: 'var(--r-xl)', padding: '16px 18px',
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    cursor: n.is_read ? 'default' : 'pointer',
                    transition: 'all var(--t-base)',
                    animation: `fadeInUp 0.35s ease ${i * 0.04}s both`, opacity: 0,
                    boxShadow: n.is_read ? 'var(--shadow-xs)' : 'var(--shadow-sm)',
                  }}>
                  <div style={{ width: 38, height: 38, borderRadius: 'var(--r-md)', background: cfg.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color, flexShrink: 0 }}>
                    {cfg.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: n.is_read ? 500 : 700, color: 'var(--text)' }}>{n.title}</span>
                      {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)', flexShrink: 0, animation: 'pulse 2s ease-in-out infinite' }}/>}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-60)', lineHeight: 1.5, marginBottom: 6 }}>{n.message}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-40)' }}>{timeAgo(n.created_at)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
