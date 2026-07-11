// src/components/shared/DeadlineBadge.js — Feature 8: Deadline tracker
import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export default function DeadlineBadge({ problemId, status }) {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (status === 'resolved' || status === 'rejected') return;
    api.get(`/problems/${problemId}/deadline`)
      .then(r => setInfo(r.data))
      .catch(() => {});
  }, [problemId, status]);

  if (!info?.estimatedDate || status === 'resolved') return null;

  const daysLeft = Math.ceil((new Date(info.estimatedDate) - Date.now()) / 86400000);
  const overdue  = info.overdue;

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 'var(--r-full)',
      background: overdue ? 'var(--danger-bg)' : daysLeft <= 3 ? 'var(--warning-bg)' : 'var(--success-bg)',
      color: overdue ? 'var(--danger)' : daysLeft <= 3 ? 'var(--warning)' : 'var(--success)',
      fontSize: 11, fontWeight: 700,
    }}>
      {overdue
        ? <><AlertTriangle size={12}/> {Math.abs(daysLeft)}d overdue</>
        : daysLeft <= 3
          ? <><Clock size={12}/> {daysLeft}d left</>
          : <><CheckCircle size={12}/> ~{info.daysEstimated}d estimated</>}
    </div>
  );
}
