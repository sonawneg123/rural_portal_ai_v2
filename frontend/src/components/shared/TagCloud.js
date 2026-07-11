// src/components/shared/TagCloud.js — Feature 9: Tag cloud filter
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function TagCloud({ onSelect, selected = '' }) {
  const [tags, setTags]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats/tags')
      .then(r => setTags(r.data.tags || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--teal)', borderTopColor: 'transparent', animation: 'spin 0.75s linear infinite' }}/></div>;
  if (!tags.length) return null;

  const maxCount = tags[0]?.count || 1;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {tags.slice(0, 30).map(({ tag, count }) => {
        const weight = count / maxCount;
        const fontSize = Math.round(10 + weight * 8);
        const isActive = selected === tag;
        return (
          <button key={tag}
            onClick={() => onSelect && onSelect(isActive ? '' : tag)}
            style={{
              fontSize, fontWeight: weight > 0.6 ? 700 : 500,
              padding: '3px 10px', borderRadius: 'var(--r-full)',
              border: `1px solid ${isActive ? 'var(--teal)' : 'var(--border)'}`,
              background: isActive ? 'rgba(0,212,178,0.12)' : 'var(--surface)',
              color: isActive ? 'var(--teal)' : `rgba(30,41,59,${0.4 + weight * 0.6})`,
              cursor: 'pointer', transition: 'all 0.18s ease',
              transform: isActive ? 'scale(1.06)' : 'scale(1)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.color = 'var(--teal)'; }}
            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = `rgba(30,41,59,${0.4 + weight * 0.6})`; } }}>
            {tag}
            <span style={{ fontSize: 9, marginLeft: 4, opacity: 0.6 }}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}
