import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';
import { notificationsApi } from '../api/admin.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PageSpinner } from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { NotificationCard } from '../components/shared/CommentCard.jsx';
import { getError } from '../api/client.js';

const FILTERS = ['all', 'status_change', 'comment', 'work_update', 'upvote', 'system'];
const LABELS  = { status_change: 'Status', comment: 'Comment', work_update: 'Work', upvote: 'Upvote', system: 'System' };

export default function Notifications() {
  const { setNotifCount } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [markingAll, setMarkingAll] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => notificationsApi.getAll({ limit: 100 }).then(r => { setNotifCount(0); return r.data; }),
  });
  const notifs = data?.data || [];

  const markRead = async (id) => {
    await notificationsApi.markRead(id).catch(() => {});
    queryClient.setQueryData(['notifications'], (old) => ({
      ...old, data: old.data.map(n => n.id === id ? { ...n, is_read: true } : n),
    }));
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllRead();
      queryClient.setQueryData(['notifications'], (old) => ({ ...old, data: old.data.map(n => ({ ...n, is_read: true })) }));
      setNotifCount(0);
      toast.success('All notifications marked as read');
    } catch (err) { toast.error(getError(err)); }
    finally { setMarkingAll(false); }
  };

  const visible  = filter === 'all' ? notifs : notifs.filter(n => n.type === filter);
  const unreadCt = notifs.filter(n => !n.is_read).length;

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-16">
      <div className="bg-gradient-to-br from-navy to-navy-light py-9">
        <div className="container-custom max-w-2xl">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-display text-2xl font-extrabold text-white tracking-tight mb-1">Notifications</h1>
              <p className="text-[13px] text-white/60">{unreadCt > 0 ? `${unreadCt} unread` : 'All caught up'}</p>
            </div>
            {unreadCt > 0 && (
              <button onClick={markAllRead} disabled={markingAll} className="btn btn-teal btn-sm">
                <Check className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="flex gap-1.5 mt-5 flex-wrap">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${filter === f ? 'bg-white text-navy' : 'bg-white/12 text-white/75'}`}>
                {f === 'all' ? `All (${notifs.length})` : `${LABELS[f]} (${notifs.filter(n => n.type === f).length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-custom max-w-2xl -mt-5 relative z-10">
        {isLoading ? <PageSpinner /> : visible.length === 0 ? (
          <div className="card p-5">
            <EmptyState emoji="🔔" title="No notifications" description="You'll see updates here when your reports change status or get comments" />
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((n, i) => (
              <NotificationCard key={n.id} notification={n} index={i} onClick={() => !n.is_read && markRead(n.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
