import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle, Megaphone, X, ChevronDown, ChevronUp, Download, Loader2 } from 'lucide-react';
import { problemsApi } from '../../api/problems.js';
import { governanceApi, adminApi } from '../../api/admin.js';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';

/* ── DeadlineBadge ─────────────────────────────────────────── */
export function DeadlineBadge({ problemId, status }) {
  const { data } = useQuery({
    queryKey: ['deadline', problemId],
    queryFn:  () => problemsApi.getDeadline(problemId).then(r => r.data),
    enabled:  status !== 'resolved' && status !== 'rejected',
  });

  if (!data?.estimatedDate || status === 'resolved') return null;

  const daysLeft = Math.ceil((new Date(data.estimatedDate) - Date.now()) / 86400000);
  const overdue  = data.overdue;

  const cls = overdue
    ? 'bg-red-50 text-red-600'
    : daysLeft <= 3
      ? 'bg-amber-50 text-amber-600'
      : 'bg-emerald-50 text-emerald-600';

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cls}`}>
      {overdue
        ? <><AlertTriangle className="w-3 h-3" /> {Math.abs(daysLeft)}d overdue</>
        : daysLeft <= 3
          ? <><Clock className="w-3 h-3" /> {daysLeft}d left</>
          : <><CheckCircle className="w-3 h-3" /> ~{data.daysEstimated}d estimated</>}
    </div>
  );
}

/* ── AnnouncementBanner ───────────────────────────────────────── */
const ROLE_COLOR = { cm:'bg-navy', collector:'bg-purple', mla:'bg-teal-dark', sarpanch:'bg-amber-500', gramsevak:'bg-emerald-600' };

export function AnnouncementBanner() {
  const { user } = useAuth();
  const [items, setItems]         = useState([]);
  const [dismissed, setDismissed] = useState(new Set());
  const [expanded, setExpanded]   = useState(new Set());

  useEffect(() => {
    if (!user) return;
    governanceApi.getAnnouncements({ state: user.state, district: user.district })
      .then(r => setItems(r.data.data || []))
      .catch(() => {});
  }, [user]);

  const visible = items.filter(a => !dismissed.has(a.id));
  if (!visible.length) return null;

  return (
    <div className="sticky top-16 z-40">
      {visible.slice(0, 2).map(a => {
        const isExp = expanded.has(a.id);
        return (
          <motion.div key={a.id} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            className={`${ROLE_COLOR[a.role] || 'bg-navy'} text-white px-5 py-2.5 flex items-center gap-3 border-b border-white/10`}>
            <Megaphone className="w-4 h-4 flex-shrink-0 opacity-85" />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm">{a.title}</div>
              {isExp && <div className="text-xs opacity-85 mt-0.5 leading-relaxed">{a.content}</div>}
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <button onClick={() => setExpanded(s => { const n = new Set(s); isExp ? n.delete(a.id) : n.add(a.id); return n; })}
                className="bg-white/15 rounded-lg px-2 py-1 text-[11px] flex items-center gap-1">
                {isExp ? <><ChevronUp className="w-3 h-3" /> Less</> : <><ChevronDown className="w-3 h-3" /> More</>}
              </button>
              <button onClick={() => setDismissed(s => new Set([...s, a.id]))}
                className="bg-white/15 rounded-lg p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
export default AnnouncementBanner;

/* ── ExportButton ─────────────────────────────────────────────── */
export function ExportButton({ filters = {}, label = 'Export CSV' }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res  = await adminApi.exportCsv(filters);
      const url  = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a    = document.createElement('a');
      a.href = url; a.download = `problems-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported successfully');
    } catch {
      toast.error('Export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleExport} disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-60">
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}
