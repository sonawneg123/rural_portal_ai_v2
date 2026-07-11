// src/components/ui/index.js
import React, { forwardRef, useState } from 'react';
import { Loader, AlertCircle, Search } from 'lucide-react';

/* ── Button ─────────────────────────────────────────────────── */
export const Button = forwardRef(({ children, variant='navy', size='md', loading, icon, className='', onClick, style, ...props }, ref) => {
  const varMap = { navy:'btn-navy', teal:'btn-teal', purple:'btn-purple', outline:'btn-outline', ghost:'btn-ghost', danger:'btn-danger' };
  const szMap  = { sm:'btn-sm', md:'', lg:'btn-lg', icon:'btn-icon' };
  return (
    <button ref={ref} className={`btn ${varMap[variant]||'btn-navy'} ${szMap[size]||''} ${className}`}
      onClick={onClick} style={style} {...props}>
      {loading ? <Loader size={15} className="anim-spin"/> : icon}
      {children}
    </button>
  );
});
Button.displayName = 'Button';

/* ── Badge ──────────────────────────────────────────────────── */
export const Badge = ({ status, children, className='' }) => (
  <span className={`badge badge-${status} ${className}`}>{children}</span>
);

export const StatusBadge = ({ status }) => {
  const labels = { pending:'Pending', in_review:'In Review', in_progress:'In Progress', resolved:'Resolved', rejected:'Rejected' };
  return <Badge status={status}>{labels[status]||status}</Badge>;
};

export const RoleBadge = ({ role }) => {
  const labels = { admin:'Admin', cm:'Chief Minister', collector:'Collector', mp:'MP', mla:'MLA', sarpanch:'Sarpanch', gramsevak:'Gram Sevak', user:'Citizen' };
  const icons  = { admin:'🔐', cm:'🏛️', collector:'🏢', mp:'🇮🇳', mla:'🏘️', sarpanch:'👤', gramsevak:'📋', user:'👤' };
  return (
    <span className={`badge role-${role}`} style={{ fontSize:11, padding:'3px 9px' }}>
      {icons[role]} {labels[role]||role}
    </span>
  );
};

/* ── Skeleton ───────────────────────────────────────────────── */
export const Skeleton = ({ width, height, className='', style }) => (
  <div className={`skeleton ${className}`} style={{ width, height, ...style }}/>
);

export const SkeletonCard = () => (
  <div style={{ background:'var(--surface)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', overflow:'hidden' }}>
    <Skeleton height={160} style={{ borderRadius:'var(--r-xl) var(--r-xl) 0 0' }}/>
    <div style={{ padding:'16px 20px 20px' }}>
      <Skeleton height={12} width="60%" style={{ marginBottom:10 }}/>
      <Skeleton height={18} width="90%" style={{ marginBottom:8 }}/>
      <Skeleton height={14} width="75%" style={{ marginBottom:16 }}/>
      <Skeleton height={10} width="40%"/>
    </div>
  </div>
);

/* ── Spinner ────────────────────────────────────────────────── */
export const Spinner = ({ size=24, color='var(--navy)', style }) => (
  <div style={{ width:size, height:size, borderRadius:'50%', border:`3px solid ${color}22`, borderTopColor:color, animation:'spin 0.75s linear infinite', ...style }}/>
);

/* ── Page loader ────────────────────────────────────────────── */
export const PageLoader = () => (
  <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'var(--bg)', gap:16 }}>
    <div style={{ width:52, height:52, borderRadius:14, background:'var(--navy)', display:'flex', alignItems:'center', justifyContent:'center', animation:'float 2s ease-in-out infinite' }}>
      <span style={{ fontSize:26 }}>🌿</span>
    </div>
    <Spinner size={32}/>
    <p style={{ color:'var(--text-60)', fontSize:14 }}>Loading…</p>
  </div>
);

/* ── Empty state ────────────────────────────────────────────── */
export const EmptyState = ({ icon: Icon=Search, emoji, title='Nothing here yet', description, action }) => (
  <div style={{ textAlign:'center', padding:'60px 20px', animation:'fadeInUp 0.4s ease both' }}>
    <div style={{ width:72, height:72, borderRadius:20, background:'var(--bg-alt)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:emoji?32:undefined }}>
      {emoji || <Icon size={28} color="var(--text-40)"/>}
    </div>
    <h3 style={{ fontSize:17, fontWeight:700, color:'var(--text)', marginBottom:8 }}>{title}</h3>
    {description && <p style={{ fontSize:14, color:'var(--text-60)', maxWidth:320, margin:'0 auto 20px', lineHeight:1.6 }}>{description}</p>}
    {action}
  </div>
);

/* ── Error state ────────────────────────────────────────────── */
export const ErrorState = ({ message, onRetry }) => (
  <div style={{ textAlign:'center', padding:'60px 20px' }}>
    <AlertCircle size={40} color="var(--danger)" style={{ margin:'0 auto 16px' }}/>
    <h3 style={{ fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:8 }}>Something went wrong</h3>
    <p style={{ fontSize:14, color:'var(--text-60)', marginBottom:20 }}>{message||'Please try again'}</p>
    {onRetry && <Button onClick={onRetry} variant="outline" size="sm">Try again</Button>}
  </div>
);

/* ── Progress ring ──────────────────────────────────────────── */
export const ProgressRing = ({ value=0, size=60, stroke=5, color='var(--teal)' }) => {
  const r    = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} stroke="var(--border)" strokeWidth={stroke} fill="none"/>
      <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
        strokeDasharray={circ} strokeDashoffset={off}
        strokeLinecap="round" style={{ transition:'stroke-dashoffset 1.2s ease' }}/>
    </svg>
  );
};

/* ── AI chip ────────────────────────────────────────────────── */
export const AIChip = ({ label='AI', style }) => (
  <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:'var(--r-full)', background:'var(--purple-glow)', color:'var(--purple)', fontSize:10, fontWeight:700, ...style }}>
    ✦ {label}
  </span>
);

/* ── Severity badge ─────────────────────────────────────────── */
export const SeverityBadge = ({ score }) => {
  const color = score>=8?'var(--danger)':score>=5?'var(--warning)':'var(--success)';
  const bg    = score>=8?'var(--danger-bg)':score>=5?'var(--warning-bg)':'var(--success-bg)';
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:'var(--r-full)', background:bg, color, fontSize:11, fontWeight:700 }}>
      Severity {score}/10
    </span>
  );
};

/* ── Budget card ────────────────────────────────────────────── */
export const BudgetCard = ({ label, allocated, used, color='var(--navy)' }) => {
  const pct = allocated>0 ? Math.min(100, Math.round((used/allocated)*100)) : 0;
  return (
    <div style={{ background:'var(--surface)', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'16px 18px', boxShadow:'var(--shadow-xs)' }}>
      <div style={{ fontSize:11, fontWeight:700, color:'var(--text-60)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>{label}</div>
      <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, color, marginBottom:2 }}>
        ₹{(allocated/100000).toFixed(1)}L
      </div>
      <div style={{ fontSize:11, color:'var(--text-60)', marginBottom:10 }}>₹{(used/100000).toFixed(1)}L used · {pct}%</div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width:`${pct}%`, background:`linear-gradient(90deg,${color},var(--teal))` }}/>
      </div>
    </div>
  );
};

/* ── Section header ─────────────────────────────────────────── */
export const SectionHeader = ({ title, subtitle, action }) => (
  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
    <div>
      <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(18px,2.5vw,24px)', fontWeight:800, color:'var(--text)', letterSpacing:'-0.4px', marginBottom:4 }}>{title}</h2>
      {subtitle && <p style={{ fontSize:13, color:'var(--text-60)' }}>{subtitle}</p>}
    </div>
    {action}
  </div>
);
