// src/components/shared/ProblemCard.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ThumbsUp, Eye, Clock, Sparkles, TrendingUp } from 'lucide-react';
import { useScrollReveal } from '../../hooks/useAnimations';
import { StatusBadge, SeverityBadge } from '../ui';
import { timeAgo } from '../../utils/helpers';

const CAT_EMOJI = { 'Water Supply':'💧','Roads & Transport':'🛣️','Electricity':'⚡','Healthcare':'🏥','Education':'📚','Agriculture':'🌾','Sanitation':'🗑️','Connectivity':'📶','Public Safety':'🛡️','Govt Schemes':'🏛️' };

export default function ProblemCard({ problem: p, index = 0 }) {
  const [ref, vis] = useScrollReveal(0.06);
  const [hov, setHov] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const hasWork = p.work_updates_count > 0;

  return (
    <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(24px)', transition: `opacity 0.45s ease ${Math.min(index*0.07,0.4)}s, transform 0.45s cubic-bezier(0.34,1.2,0.64,1) ${Math.min(index*0.07,0.4)}s` }}>
      <Link to={`/problems/${p.id}`}
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          display: 'block', textDecoration: 'none',
          background: '#fff', borderRadius: 'var(--r-xl)',
          border: hov ? '1px solid var(--teal)' : '1px solid var(--border)',
          boxShadow: hov ? '0 12px 36px rgba(0,212,178,0.14)' : 'var(--shadow-sm)',
          transform: hov ? 'translateY(-5px) scale(1.01)' : 'translateY(0) scale(1)',
          transition: 'all 0.28s cubic-bezier(0.34,1.3,0.64,1)',
          overflow: 'hidden',
        }}>

        {/* Thumbnail */}
        <div style={{ position: 'relative', height: 164, overflow: 'hidden', background: 'var(--bg-alt)' }}>
          {p.thumbnail && !imgErr ? (
            <img src={p.thumbnail} alt={p.title} onError={() => setImgErr(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: hov ? 'scale(1.06)' : 'scale(1)', transition: 'transform 0.5s ease' }}/>
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
              {CAT_EMOJI[p.category] || '📋'}
            </div>
          )}
          <span style={{ position: 'absolute', top: 10, left: 10, padding: '3px 10px', borderRadius: 'var(--r-full)', background: p.category_color || 'var(--navy)', color: '#fff', fontSize: 10, fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            {p.category}
          </span>
          {hasWork && (
            <span style={{ position: 'absolute', top: 10, right: 10, padding: '3px 9px', borderRadius: 'var(--r-full)', background: 'rgba(10,37,64,0.88)', backdropFilter: 'blur(6px)', color: 'var(--teal)', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
              <TrendingUp size={9}/> Work logged
            </span>
          )}
          <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', borderRadius: 'var(--r-full)', padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 4, color: '#fff', fontSize: 11, fontWeight: 600 }}>
            <ThumbsUp size={10}/>{p.upvotes}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '14px 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9, flexWrap: 'wrap' }}>
            <StatusBadge status={p.status}/>
            {p.ai_severity_score && <SeverityBadge score={p.ai_severity_score}/>}
          </div>

          <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {p.title}
          </h3>

          {/* AI summary */}
          {p.ai_summary && (
            <div style={{ background: 'var(--bg-alt)', borderRadius: 'var(--r-md)', padding: '7px 10px', marginBottom: 9, display: 'flex', gap: 6, alignItems: 'flex-start', transform: hov ? 'translateX(2px)' : 'none', transition: 'transform var(--t-base)' }}>
              <Sparkles size={11} color="var(--purple)" style={{ flexShrink: 0, marginTop: 2 }}/>
              <span style={{ fontSize: 11, color: 'var(--text-60)', lineHeight: 1.5, fontStyle: 'italic' }}>{p.ai_summary.slice(0, 90)}…</span>
            </div>
          )}

          {/* Severity bar */}
          {p.ai_severity_score && (
            <div style={{ marginBottom: 9 }}>
              <div className="progress-track" style={{ height: 5 }}>
                <div style={{
                  height: '100%', borderRadius: 'var(--r-full)',
                  background: p.ai_severity_score >= 8 ? 'linear-gradient(90deg,var(--danger),#F97316)' : p.ai_severity_score >= 5 ? 'linear-gradient(90deg,var(--warning),#FCD34D)' : 'linear-gradient(90deg,var(--navy),var(--teal))',
                  width: vis ? `${p.ai_severity_score * 10}%` : '0%',
                  transition: `width 1.1s cubic-bezier(0.4,0,0.2,1) ${Math.min(index*0.07,0.4) + 0.3}s`,
                }}/>
              </div>
            </div>
          )}

          {/* Tags */}
          {p.ai_tags && (
            <div style={{ display: 'flex', gap: 4, marginBottom: 9, flexWrap: 'wrap' }}>
              {p.ai_tags.split(',').slice(0, 3).map((t, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 'var(--r-full)', background: 'var(--bg-alt)', color: 'var(--text-60)' }}>{t.trim()}</span>
              ))}
            </div>
          )}

          {/* Location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10, fontSize: 12, color: 'var(--text-60)' }}>
            <MapPin size={11}/>{p.village}, {p.district}, {p.state}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 9 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--navy)', color: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>
                {p.reporter_name?.[0] || '?'}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-60)' }}>{p.reporter_name}</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ fontSize: 11, color: 'var(--text-40)', display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={10}/>{p.views}</span>
              <span style={{ fontSize: 11, color: 'var(--text-40)', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10}/>{timeAgo(p.created_at)}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
