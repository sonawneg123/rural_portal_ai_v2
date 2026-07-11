// src/pages/WorkProgress.js
// ─────────────────────────────────────────────────────────────────
// NEW MODULE: Work Progress Tracker
// Citizens upload evidence photos of ongoing/completed work.
// Each update is timestamped, geo-tagged, and AI-verified.
// This solves the "black hole" of problems marked resolved
// on paper but not fixed on the ground.
// ─────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  Camera, CheckCircle, Clock, ArrowLeft, Upload,
  X, MapPin, AlertTriangle, TrendingUp, Sparkles,
  ThumbsUp, Eye, Loader, Shield, Flag,
} from 'lucide-react';
import api, { getError } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useScrollReveal } from '../hooks/useAnimations';
import { Button, Spinner, EmptyState, ErrorState, AIChip } from '../components/ui';
import { formatDate, timeAgo } from '../utils/helpers';
import toast from 'react-hot-toast';

/* ── Progress update card ────────────────────────────────────── */
function UpdateCard({ update, index, onVerify, onFlag, isAdmin }) {
  const [ref, vis]  = useScrollReveal(0.1);
  const [selImg, setSelImg] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const statusColor = {
    submitted:  '#D97706',
    ai_verified:'#7C3AED',
    approved:   '#16A34A',
    disputed:   '#DC2626',
  }[update.status] || '#6B7280';

  const handleVerify = async () => {
    setVerifying(true);
    try { await onVerify(update.id); }
    finally { setVerifying(false); }
  };

  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(24px)',
      transition: `all 0.5s ease ${index * 0.08}s`,
    }}>
      <div style={{
        background: '#fff', borderRadius: 'var(--r-xl)',
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--forest)', color: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
            {update.reporter_name?.[0] || '?'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{update.reporter_name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-60)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={10}/>{timeAgo(update.created_at)}
              {update.location_name && (
                <><MapPin size={10}/>{update.location_name}</>
              )}
            </div>
          </div>

          {/* Status badge */}
          <span style={{
            padding: '4px 10px', borderRadius: 'var(--r-full)',
            background: statusColor + '15', color: statusColor,
            fontSize: 10, fontWeight: 700,
          }}>
            {update.status === 'ai_verified' ? '✦ AI Verified' :
             update.status === 'approved'    ? '✓ Approved' :
             update.status === 'disputed'    ? '⚠ Disputed' : 'Submitted'}
          </span>
        </div>

        {/* Photo grid */}
        {update.photos?.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(update.photos.length, 3)}, 1fr)`, gap: 2 }}>
            {update.photos.slice(0, 3).map((ph, i) => (
              <div key={i} style={{ position: 'relative', paddingBottom: '60%', overflow: 'hidden', cursor: 'zoom-in', background: 'var(--cream-dark)' }}
                onClick={() => setSelImg(ph.url)}>
                <img src={ph.url} alt="progress" onError={e => e.target.style.display='none'}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                  onMouseEnter={e => e.target.style.transform='scale(1.05)'}
                  onMouseLeave={e => e.target.style.transform='scale(1)'}/>
                {i === 2 && update.photos.length > 3 && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 700 }}>
                    +{update.photos.length - 3}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Description + AI analysis */}
        <div style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.6, marginBottom: update.ai_analysis ? 12 : 0 }}>
            {update.description}
          </p>

          {/* AI Analysis box */}
          {update.ai_analysis && (
            <div style={{ background: 'var(--purple-bg)', borderRadius: 'var(--r-md)', padding: '12px 14px', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <AIChip label="Groq Analysis"/>
                {update.ai_work_completion_pct !== null && (
                  <span style={{ fontSize: 11, color: 'var(--purple)', fontWeight: 700 }}>
                    {update.ai_work_completion_pct}% work completed (estimated)
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12, color: 'var(--purple)', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
                {update.ai_analysis}
              </p>
            </div>
          )}

          {/* Work completion bar */}
          {update.ai_work_completion_pct !== null && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-60)' }}>Work completion</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--forest)' }}>{update.ai_work_completion_pct}%</span>
              </div>
              <div className="progress-bar">
                <div style={{
                  height: '100%', borderRadius: 'var(--r-full)',
                  background: 'linear-gradient(90deg, var(--forest), var(--lime))',
                  width: `${update.ai_work_completion_pct}%`,
                  transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
                }}/>
              </div>
            </div>
          )}

          {/* Action row */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 'var(--r-md)', background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--ink)', cursor: 'pointer', transition: 'all var(--t-fast)' }}
              onMouseEnter={e => { e.currentTarget.style.background='var(--sage-light)'; e.currentTarget.style.color='var(--forest)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='var(--surface)'; e.currentTarget.style.color='var(--ink)'; }}>
              <ThumbsUp size={12}/>{update.helpful_votes || 0} Helpful
            </button>

            {isAdmin && update.status === 'submitted' && (
              <Button size="sm" variant="lime" onClick={handleVerify} loading={verifying}>
                <CheckCircle size={13}/> Approve
              </Button>
            )}

            {isAdmin && (
              <button onClick={() => onFlag(update.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 'var(--r-md)', background: 'var(--danger-bg)', border: 'none', fontSize: 12, fontWeight: 600, color: 'var(--danger)', cursor: 'pointer' }}>
                <Flag size={12}/> Dispute
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {selImg && (
        <div onClick={() => setSelImg(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease both' }}>
          <img src={selImg} alt="full" style={{ maxWidth: '90vw', maxHeight: '88vh', borderRadius: 'var(--r-lg)', animation: 'scaleIn 0.25s ease both' }}/>
          <button onClick={() => setSelImg(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
            <X size={20}/>
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Upload form ─────────────────────────────────────────────── */
function UploadForm({ problemId, onSuccess }) {
  const [photos,   setPhotos]   = useState([]);
  const [previews, setPreviews] = useState([]);
  const [desc,     setDesc]     = useState('');
  const [location, setLocation] = useState('');
  const [pct,      setPct]      = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [focusDesc, setFocusDesc]   = useState(false);

  const onDrop = useCallback((files) => {
    const allowed = files.slice(0, 5 - photos.length);
    setPhotos(p => [...p, ...allowed]);
    allowed.forEach(f => {
      const r = new FileReader();
      r.onload = e => setPreviews(p => [...p, e.target.result]);
      r.readAsDataURL(f);
    });
  }, [photos]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.jpg','.jpeg','.png','.webp'] },
    maxSize: 8 * 1024 * 1024, disabled: photos.length >= 5,
    onDropRejected: () => toast.error('Max 8 MB per image'),
  });

  const removePhoto = (i) => {
    setPhotos(p => p.filter((_,idx) => idx!==i));
    setPreviews(p => p.filter((_,idx) => idx!==i));
  };

  const submit = async () => {
    if (!desc.trim())        { toast.error('Please describe the work update'); return; }
    if (photos.length === 0) { toast.error('Please upload at least one photo'); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('description', desc);
      fd.append('location_name', location);
      fd.append('work_completion_pct', pct || '');
      photos.forEach(f => fd.append('photos', f));

      await api.post(`/problems/${problemId}/work-updates`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Work update submitted! Groq AI is analysing your photos…');
      onSuccess();
      setPhotos([]); setPreviews([]); setDesc(''); setLocation(''); setPct('');
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', padding: '24px', boxShadow: 'var(--shadow-sm)', animation: 'fadeInUp 0.4s ease both' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', background: 'var(--forest)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Camera size={18} color="var(--lime)"/>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Submit Work Update</div>
          <div style={{ fontSize: 12, color: 'var(--ink-60)' }}>Upload photos + description · Groq AI will verify progress</div>
        </div>
      </div>

      {/* Photo dropzone */}
      <div style={{ marginBottom: 16 }}>
        <label className="input-label">Photos * (up to 5)</label>
        <div {...getRootProps()} style={{
          border: `2px dashed ${isDragActive ? 'var(--forest)' : 'var(--border-dark)'}`,
          borderRadius: 'var(--r-lg)', padding: '24px', textAlign: 'center',
          cursor: photos.length >= 5 ? 'not-allowed' : 'pointer',
          background: isDragActive ? 'var(--sage-light)' : 'var(--surface)',
          transition: 'all var(--t-fast)',
          transform: isDragActive ? 'scale(1.01)' : 'scale(1)',
        }}>
          <input {...getInputProps()}/>
          <Upload size={24} color={isDragActive ? 'var(--forest)' : 'var(--ink-40)'} style={{ margin: '0 auto 8px' }}/>
          <p style={{ fontSize: 13, color: isDragActive ? 'var(--forest)' : 'var(--ink-60)', fontWeight: 500, margin: '0 0 4px' }}>
            {isDragActive ? 'Drop photos here…' : 'Drag & drop or click to select'}
          </p>
          <p style={{ fontSize: 11, color: 'var(--ink-40)', margin: 0 }}>JPG · PNG · WEBP · Max 8 MB · {5 - photos.length} remaining</p>
        </div>

        {previews.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            {previews.map((src, i) => (
              <div key={i} style={{ position: 'relative', animation: 'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both' }}>
                <img src={src} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 'var(--r-md)', border: '2px solid var(--sage)' }}/>
                <button onClick={() => removePhoto(i)} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: 'var(--danger)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform var(--t-spring)' }}
                  onMouseEnter={e => e.currentTarget.style.transform='scale(1.15)'}
                  onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
                  <X size={11} color="#fff"/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div style={{ marginBottom: 14 }}>
        <label className="input-label">Work Description *</label>
        <textarea value={desc} onChange={e => setDesc(e.target.value)}
          onFocus={() => setFocusDesc(true)} onBlur={() => setFocusDesc(false)}
          placeholder="Describe what work was done, what stage it's at, any issues…"
          maxLength={1000}
          style={{
            ...inputStyle,
            minHeight: 90, resize: 'vertical',
            borderColor: focusDesc ? 'var(--forest)' : 'var(--border-dark)',
            boxShadow: focusDesc ? '0 0 0 3px rgba(10,61,31,0.1)' : 'none',
          }}/>
        <div className="input-hint" style={{ textAlign: 'right' }}>{desc.length}/1000</div>
      </div>

      {/* Location + percentage row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div>
          <label className="input-label">Location (optional)</label>
          <input value={location} onChange={e => setLocation(e.target.value)} style={inputStyle}
            placeholder="e.g. Near Shiva temple"/>
        </div>
        <div>
          <label className="input-label">Work completion % (optional)</label>
          <input type="number" min="0" max="100" value={pct} onChange={e => setPct(e.target.value)}
            style={inputStyle} placeholder="e.g. 40"/>
        </div>
      </div>

      {/* AI note */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--purple-bg)', borderRadius: 'var(--r-md)', padding: '10px 14px', marginBottom: 16 }}>
        <Sparkles size={14} color="var(--purple)" style={{ flexShrink: 0, animation: 'pulse 2s ease-in-out infinite' }}/>
        <span style={{ fontSize: 12, color: 'var(--purple)', fontWeight: 500 }}>
          Groq AI will analyse your photos and estimate work completion % automatically
        </span>
      </div>

      <Button variant="primary" onClick={submit} loading={submitting} style={{ width: '100%', justifyContent: 'center' }}>
        <TrendingUp size={16}/> Submit Work Update
      </Button>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 13px', border: '1.5px solid var(--border-dark)',
  borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--ink)', outline: 'none',
  fontFamily: 'var(--font-body)', background: '#fff', boxSizing: 'border-box',
  transition: 'border-color var(--t-fast), box-shadow var(--t-fast)',
};

/* ── Main Work Progress page ─────────────────────────────────── */
export default function WorkProgress() {
  const { id }      = useParams();
  const { user, isAdmin } = useAuth();
  const [problem,  setProblem]  = useState(null);
  const [updates,  setUpdates]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [showForm, setShowForm] = useState(false);

  const totalPct = updates.length > 0
    ? Math.round(updates.filter(u => u.ai_work_completion_pct).reduce((sum, u) => sum + u.ai_work_completion_pct, 0) / updates.filter(u => u.ai_work_completion_pct).length)
    : 0;

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, uRes] = await Promise.all([
        api.get(`/problems/${id}`),
        api.get(`/problems/${id}/work-updates`),
      ]);
      setProblem(pRes.data.data);
      setUpdates(uRes.data.data || []);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleVerify = async (updateId) => {
    await api.patch(`/work-updates/${updateId}/approve`);
    toast.success('Update approved');
    load();
  };

  const handleFlag = async (updateId) => {
    await api.patch(`/work-updates/${updateId}/dispute`);
    toast.success('Update marked as disputed');
    load();
  };

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner size={36}/>
    </div>
  );

  if (error) return (
    <div className="container" style={{ padding: '40px 0' }}>
      <ErrorState message={error} onRetry={load}/>
    </div>
  );

  return (
    <div className="page-enter" style={{ background: 'var(--surface)', minHeight: '100vh', padding: '24px 0 60px' }}>
      <div className="container-md">

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link to={`/problems/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: 'var(--ink-60)', textDecoration: 'none', transition: 'color var(--t-fast)' }}
            onMouseEnter={e => { e.currentTarget.style.color='var(--forest)'; e.currentTarget.style.transform='translateX(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.color='var(--ink-60)'; e.currentTarget.style.transform='translateX(0)'; }}>
            <ArrowLeft size={15}/> Back to problem
          </Link>
          <span style={{ color: 'var(--border-dark)' }}>·</span>
          <span style={{ fontSize: 13, color: 'var(--ink-40)' }}>Work Progress</span>
        </div>

        {/* Problem summary header */}
        {problem && (
          <div style={{ background: 'linear-gradient(135deg, var(--forest), var(--forest-light))', borderRadius: 'var(--r-xl)', padding: '24px 28px', marginBottom: 28, color: '#fff', animation: 'fadeInDown 0.4s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--lime)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                  Work Progress Tracker
                </div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.4px' }}>
                  {problem.title}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                  <MapPin size={12}/>{problem.village}, {problem.district}
                </div>
              </div>

              {/* Overall progress ring */}
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ position: 'relative', width: 80, height: 80 }}>
                  <svg width={80} height={80} style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx={40} cy={40} r={32} stroke="rgba(255,255,255,0.15)" strokeWidth={6} fill="none"/>
                    <circle cx={40} cy={40} r={32} stroke="var(--lime)" strokeWidth={6} fill="none"
                      strokeDasharray={201} strokeDashoffset={201 - (totalPct / 100) * 201}
                      strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.5s ease' }}/>
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: '#fff' }}>{totalPct}</span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>% done</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>AI estimate</div>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 20, marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.15)', flexWrap: 'wrap' }}>
              {[
                { label: 'Updates', val: updates.length },
                { label: 'AI Verified', val: updates.filter(u => u.status === 'ai_verified' || u.status === 'approved').length },
                { label: 'Photos', val: updates.reduce((s, u) => s + (u.photos?.length || 0), 0) },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--lime)' }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload form toggle */}
        {user && problem?.status !== 'resolved' && (
          <div style={{ marginBottom: 24 }}>
            {!showForm ? (
              <button onClick={() => setShowForm(true)} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '16px 20px',
                background: '#fff', border: '2px dashed var(--border-dark)', borderRadius: 'var(--r-xl)',
                cursor: 'pointer', textAlign: 'left', transition: 'all var(--t-fast)',
                color: 'var(--ink-60)',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--forest)'; e.currentTarget.style.background='var(--sage-light)'; e.currentTarget.style.color='var(--forest)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-dark)'; e.currentTarget.style.background='#fff'; e.currentTarget.style.color='var(--ink-60)'; }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', background: 'var(--cream-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Camera size={18}/>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Submit a work update</div>
                  <div style={{ fontSize: 12 }}>Upload photos of progress · Groq AI will verify and estimate completion %</div>
                </div>
              </button>
            ) : (
              <UploadForm problemId={id} onSuccess={() => { setShowForm(false); load(); }}/>
            )}
          </div>
        )}

        {/* Timeline */}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.3px' }}>
            Progress Timeline
            <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 500, color: 'var(--ink-60)' }}>
              {updates.length} update{updates.length !== 1 ? 's' : ''}
            </span>
          </h2>
        </div>

        {updates.length === 0 ? (
          <EmptyState emoji="📸" title="No work updates yet" description="Be the first to document the work being done on this problem. Upload photos of progress to ensure accountability." action={user && <Button variant="primary" onClick={() => setShowForm(true)}><Camera size={15}/> Add First Update</Button>}/>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
            {/* Timeline line */}
            <div style={{ position: 'absolute', left: 20, top: 20, bottom: 20, width: 2, background: 'linear-gradient(180deg, var(--forest), var(--lime))', borderRadius: 2, opacity: 0.3 }}/>
            <div style={{ paddingLeft: 8 }}>
              {updates.map((u, i) => (
                <UpdateCard key={u.id} update={u} index={i} onVerify={handleVerify} onFlag={handleFlag} isAdmin={isAdmin}/>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
