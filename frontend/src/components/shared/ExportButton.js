// src/components/shared/ExportButton.js — Feature 12: Export CSV
import React, { useState } from 'react';
import api, { getError } from '../../utils/api';
import { Download, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExportButton({ filters = {}, label = 'Export CSV', style }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      );
      const response = await fetch(`/api/admin/export/csv?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('rp_token')}` },
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `problems-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported successfully');
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleExport} disabled={loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '8px 16px', borderRadius: 'var(--r-md)',
        background: 'var(--success-bg)', color: 'var(--success)',
        border: '1px solid rgba(16,185,129,0.3)',
        fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1, transition: 'all 0.2s',
        ...style,
      }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#D1FAE5'; }}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--success-bg)'}>
      {loading ? <Loader size={14} style={{ animation: 'spin 0.75s linear infinite' }}/> : <Download size={14}/>}
      {label}
    </button>
  );
}
