// src/components/shared/AnnouncementBanner.js — Governance announcements
import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Megaphone, X, ChevronDown, ChevronUp } from 'lucide-react';

const ROLE_COLOR = { cm:'var(--navy)', collector:'var(--purple)', mla:'var(--teal)', sarpanch:'#F59E0B', gramsevak:'var(--success)' };

export default function AnnouncementBanner() {
  const { user }    = useAuth();
  const [items, setItems]   = useState([]);
  const [dismissed, setDismissed] = useState(new Set());
  const [expanded,  setExpanded]  = useState(new Set());

  useEffect(() => {
    if (!user) return;
    api.get(`/announcements?state=${encodeURIComponent(user.state || '')}&district=${encodeURIComponent(user.district || '')}`)
      .then(r => setItems(r.data.data || []))
      .catch(() => {});
  }, [user]);

  const visible = items.filter(a => !dismissed.has(a.id));
  if (!visible.length) return null;

  return (
    <div style={{ position: 'sticky', top: 64, zIndex: 180 }}>
      {visible.slice(0, 2).map(a => {
        const color = ROLE_COLOR[a.role] || 'var(--navy)';
        const isExp = expanded.has(a.id);
        return (
          <div key={a.id} style={{ background: color, color: '#fff', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, animation: 'fadeInDown 0.3s ease both', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <Megaphone size={15} style={{ flexShrink: 0, opacity: 0.85 }}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{a.title}</div>
              {isExp && <div style={{ fontSize: 12, opacity: 0.85, marginTop: 3, lineHeight: 1.5 }}>{a.content}</div>}
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button onClick={() => setExpanded(s => { const n = new Set(s); isExp ? n.delete(a.id) : n.add(a.id); return n; })}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 'var(--r-sm)', padding: '3px 8px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11 }}>
                {isExp ? <><ChevronUp size={12}/> Less</> : <><ChevronDown size={12}/> More</>}
              </button>
              <button onClick={() => setDismissed(s => new Set([...s, a.id]))}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 'var(--r-sm)', padding: '4px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <X size={14}/>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
