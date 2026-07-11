// src/pages/ProblemDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, Clock, Eye, ThumbsUp, Send, Sparkles,
  ArrowLeft, Shield, TrendingUp, Camera, Share2,
  AlertTriangle, CheckCircle, Loader, X, Flag,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import api, { getError } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useScrollReveal } from '../hooks/useAnimations';
import { StatusBadge, SeverityBadge, AIChip, Spinner, ErrorState, Button } from '../components/ui';
import { STATUS_CONFIG, PRIORITY_CONFIG, formatDate, timeAgo } from '../utils/helpers';
import toast from 'react-hot-toast';

/* ── Comment bubble ─────────────────────────────────────────── */
function CommentBubble({ comment, index }) {
  const [ref, vis] = useScrollReveal(0.05);
  return (
    <div ref={ref} style={{
      opacity:    vis ? 1 : 0,
      transform:  vis ? 'translateY(0)' : 'translateY(16px)',
      transition: `all 0.4s ease ${index * 0.06}s`,
    }}>
      <div style={{
        background: comment.is_official ? 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' : 'var(--surface)',
        border:     comment.is_official ? '1px solid #BFDBFE' : '1px solid var(--border)',
        borderRadius: 'var(--r-lg)', padding: '14px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: comment.is_official ? '#2563EB' : 'var(--forest)',
            color: comment.is_official ? '#fff' : 'var(--lime)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, flexShrink: 0,
          }}>
            {comment.is_official ? <Shield size={14}/> : comment.author?.[0] || '?'}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: comment.is_official ? '#1D4ED8' : 'var(--ink)' }}>
              {comment.is_official ? '🏛️ Official Response' : comment.author}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-40)' }}>{timeAgo(comment.created_at)}</div>
          </div>
        </div>
        <p style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.6, margin: 0 }}>{comment.content}</p>
      </div>
    </div>
  );
}

/* ── Sidebar card ───────────────────────────────────────────── */
function SideCard({ children, style }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 'var(--r-xl)',
      border: '1px solid var(--border)', padding: '18px',
      boxShadow: 'var(--shadow-sm)', ...style,
    }}>
      {children}
    </div>
  );
}

export default function ProblemDetail() {
  const { id }    = useParams();
  const { user, isAdmin } = useAuth();
  const [problem,    setProblem]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [comment,    setComment]    = useState('');
  const [posting,    setPosting]    = useState(false);
  const [upvoted,    setUpvoted]    = useState(false);
  const [upvoteAnim, setUpvoteAnim] = useState(false);
  const [insight,    setInsight]    = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [showAllTags, setShowAllTags] = useState(false);
  const [copyDone,   setCopyDone]   = useState(false);
  const [headerRef,  headerVis]     = useScrollReveal(0.05);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/problems/${id}`);
      setProblem(data.data);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--forest)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', animation: 'float 2s ease-in-out infinite' }}>
          <span style={{ fontSize: 26 }}>🌿</span>
        </div>
        <Spinner size={32}/>
      </div>
    </div>
  );

  if (error) return (
    <div className="container" style={{ padding: '60px 0' }}>
      <ErrorState message={error} onRetry={load}/>
    </div>
  );

  if (!problem) return null;

  const tags       = problem.ai_tags ? problem.ai_tags.split(',').filter(Boolean) : [];
  const priority   = PRIORITY_CONFIG[problem.priority] || PRIORITY_CONFIG.medium;
  const workUpdatesCount = problem.work_updates_count || 0;

  const handleUpvote = async () => {
    if (!user) { toast.error('Please login to upvote'); return; }
    if (upvoted) { toast('Already upvoted!', { icon: '👍' }); return; }
    try {
      setUpvoteAnim(true);
      setTimeout(() => setUpvoteAnim(false), 600);
      const { data } = await api.post(`/problems/${id}/upvote`);
      setProblem(p => ({ ...p, upvotes: data.upvotes }));
      setUpvoted(true);
      toast.success('Upvoted! This helps boost priority. 👍');
    } catch { toast.error('Could not upvote'); }
  };

  const handleComment = async () => {
    if (!comment.trim()) { toast.error('Comment cannot be empty'); return; }
    setPosting(true);
    try {
      await api.post(`/problems/${id}/comment`, { content: comment.trim() });
      toast.success('Comment posted!');
      setComment('');
      load();
    } catch (err) {
      toast.error(getError(err));
    } finally { setPosting(false); }
  };

  const fetchInsight = async () => {
    setInsightLoading(true);
    try {
      const { data } = await api.get(`/admin/problems/${id}/insight`);
      setInsight(data.insight);
    } catch { toast.error('Could not fetch insight'); }
    finally { setInsightLoading(false); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyDone(true);
    toast.success('Link copied!');
    setTimeout(() => setCopyDone(false), 2000);
  };

  const visibleTags = showAllTags ? tags : tags.slice(0, 5);

  return (
    <div className="page-enter" style={{ background: 'var(--surface)', minHeight: '100vh', paddingBottom: 60 }}>
      {/* Lightbox */}
      {lightboxImg && (
        <div onClick={() => setLightboxImg(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease both' }}>
          <button onClick={() => setLightboxImg(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', backdropFilter: 'blur(8px)' }}>
            <X size={20}/>
          </button>
          <img src={lightboxImg} alt="fullsize" style={{ maxWidth: '90vw', maxHeight: '88vh', borderRadius: 'var(--r-xl)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)', animation: 'scaleIn 0.25s cubic-bezier(0.34,1.2,0.64,1) both', objectFit: 'contain' }}/>
        </div>
      )}

      {/* Back nav */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '12px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/problems" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--ink-60)', textDecoration: 'none', transition: 'all var(--t-fast)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--forest)'; e.currentTarget.style.transform = 'translateX(-3px)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-60)'; e.currentTarget.style.transform = 'translateX(0)'; }}>
            <ArrowLeft size={15}/> Back to Problems
          </Link>
          <button onClick={copyLink} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: copyDone ? 'var(--forest)' : 'var(--ink-60)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color var(--t-fast)' }}>
            <Share2 size={14}/> {copyDone ? 'Copied!' : 'Share'}
          </button>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'flex-start' }}>

          {/* ── Main column ────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Header card */}
            <div ref={headerRef} style={{
              background: '#fff', borderRadius: 'var(--r-xl)',
              border: '1px solid var(--border)', padding: '24px 26px',
              boxShadow: 'var(--shadow-sm)',
              opacity: headerVis ? 1 : 0,
              transform: headerVis ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.5s ease',
            }}>
              {/* Status + priority row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                <StatusBadge status={problem.status}/>
                {problem.ai_severity_score && <SeverityBadge score={problem.ai_severity_score}/>}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 'var(--r-full)', background: 'var(--surface)', color: priority.color, fontSize: 11, fontWeight: 700 }}>
                  ● {priority.label} Priority
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 'var(--r-full)', background: 'var(--surface)', color: 'var(--ink-60)', fontSize: 11, fontWeight: 600 }}>
                  {problem.category}
                </span>
              </div>

              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.25, letterSpacing: '-0.6px', marginBottom: 14 }}>
                {problem.title}
              </h1>

              {/* Meta info */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
                {[
                  { icon: <MapPin size={13}/>, text: `${problem.village}, ${problem.district}, ${problem.state}` },
                  { icon: <Clock size={13}/>,  text: timeAgo(problem.created_at) },
                  { icon: <Eye size={13}/>,    text: `${problem.views} views` },
                  { icon: <ThumbsUp size={13}/>, text: `${problem.upvotes} upvotes` },
                ].map((item, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--ink-60)' }}>
                    {item.icon}{item.text}
                  </span>
                ))}
              </div>

              {/* AI severity bar */}
              {problem.ai_severity_score && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-60)' }}>AI Severity Score</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)' }}>{problem.ai_severity_score}/10</span>
                  </div>
                  <div className="progress-bar" style={{ height: 8 }}>
                    <div style={{
                      height: '100%', borderRadius: 'var(--r-full)', transition: 'width 1.4s cubic-bezier(0.4,0,0.2,1)',
                      width: `${problem.ai_severity_score * 10}%`,
                      background: problem.ai_severity_score >= 8
                        ? 'linear-gradient(90deg, var(--danger), #FF6B6B)'
                        : problem.ai_severity_score >= 5
                          ? 'linear-gradient(90deg, var(--warning), #FFD700)'
                          : 'linear-gradient(90deg, var(--forest), var(--lime))',
                    }}/>
                  </div>
                </div>
              )}

              {/* Groq AI Summary */}
              {problem.ai_summary && (
                <div style={{ background: 'var(--purple-bg)', border: '1px solid #DDD6FE', borderRadius: 'var(--r-lg)', padding: '16px 18px', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
                    <Sparkles size={14} color="var(--purple)" style={{ animation: 'pulse 2s ease-in-out infinite' }}/>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      AI Summary — Groq llama3-8b
                    </span>
                    <AIChip/>
                  </div>
                  <p style={{ fontSize: 14, color: '#4C1D95', lineHeight: 1.65, margin: '0 0 12px', fontStyle: 'italic' }}>
                    {problem.ai_summary}
                  </p>
                  {tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
                      {visibleTags.map((t, i) => (
                        <span key={i} style={{
                          fontSize: 11, fontWeight: 600, padding: '3px 9px',
                          borderRadius: 'var(--r-full)', background: '#EDE9FE', color: 'var(--purple)',
                          animation: `scaleIn 0.3s ease ${i * 0.06}s both`,
                        }}>
                          {t.trim()}
                        </span>
                      ))}
                      {tags.length > 5 && (
                        <button onClick={() => setShowAllTags(!showAllTags)} style={{ fontSize: 11, fontWeight: 600, color: 'var(--purple)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                          {showAllTags ? <><ChevronUp size={12}/> less</> : <><ChevronDown size={12}/> +{tags.length - 5} more</>}
                        </button>
                      )}
                    </div>
                  )}
                  {problem.ai_responsible_dept && (
                    <div style={{ marginTop: 10, fontSize: 12, color: 'var(--purple)', fontWeight: 600 }}>
                      📋 Responsible dept: {problem.ai_responsible_dept}
                    </div>
                  )}
                </div>
              )}

              {/* Full description */}
              <div style={{ marginBottom: problem.admin_notes ? 20 : 0 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>Full Description</h3>
                <p style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.75, margin: 0 }}>{problem.description}</p>
              </div>

              {/* Budget estimate */}
              {problem.budget_estimate && (
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--warning-bg)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--warning)', fontWeight: 600 }}>
                  <AlertTriangle size={15}/> Estimated cost to fix: ₹{Number(problem.budget_estimate).toLocaleString('en-IN')}
                </div>
              )}

              {/* Admin notes */}
              {problem.admin_notes && (
                <div style={{ marginTop: 20, background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', border: '1px solid #BFDBFE', borderRadius: 'var(--r-lg)', padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 11, fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    <Shield size={14} color="#2563EB"/> Official Response
                  </div>
                  <p style={{ fontSize: 14, color: '#1E3A8A', lineHeight: 1.65, margin: 0 }}>{problem.admin_notes}</p>
                </div>
              )}

              {/* Admin Groq insight */}
              {isAdmin && (
                <div style={{ marginTop: 20, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 'var(--r-lg)', padding: '16px 18px' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#92400E', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                    🤖 Groq Admin Insight
                  </div>
                  {insight
                    ? <p style={{ fontSize: 13, color: '#78350F', lineHeight: 1.6, margin: 0, animation: 'fadeInUp 0.35s ease both' }}>{insight}</p>
                    : <Button size="sm" variant="ghost" onClick={fetchInsight} loading={insightLoading}>
                        <Sparkles size={13}/> Get AI action suggestion
                      </Button>
                  }
                </div>
              )}
            </div>

            {/* Photos */}
            {problem.photos?.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', padding: '20px 24px', boxShadow: 'var(--shadow-sm)', animation: 'fadeInUp 0.5s ease 0.1s both', opacity: 0 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 14 }}>
                  Photos ({problem.photos.length})
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                  {problem.photos.map((ph, i) => (
                    <div key={ph.id} onClick={() => setLightboxImg(ph.s3_url)} style={{
                      paddingBottom: '75%', position: 'relative', borderRadius: 'var(--r-md)',
                      overflow: 'hidden', cursor: 'zoom-in', background: 'var(--cream-dark)',
                      animation: `scaleIn 0.4s ease ${i * 0.07}s both`, opacity: 0,
                    }}>
                      <img src={ph.s3_url} alt="" onError={e => e.target.style.display='none'}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                        onMouseEnter={e => e.target.style.transform='scale(1.07)'}
                        onMouseLeave={e => e.target.style.transform='scale(1)'}/>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Work progress link */}
            <Link to={`/problems/${id}/work-progress`} style={{
              display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none',
              background: workUpdatesCount > 0 ? 'linear-gradient(135deg, var(--forest), var(--forest-light))' : '#fff',
              border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '18px 22px',
              boxShadow: 'var(--shadow-sm)', transition: 'all 0.25s ease',
              animation: 'fadeInUp 0.5s ease 0.15s both', opacity: 0,
            }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='var(--shadow-md)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='var(--shadow-sm)'; }}>
              <div style={{ width: 46, height: 46, borderRadius: 'var(--r-md)', background: workUpdatesCount > 0 ? 'rgba(127,212,58,0.2)' : 'var(--sage-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Camera size={22} color={workUpdatesCount > 0 ? 'var(--lime)' : 'var(--forest)'}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: workUpdatesCount > 0 ? '#fff' : 'var(--ink)', marginBottom: 3 }}>
                  Work Progress Tracker
                </div>
                <div style={{ fontSize: 13, color: workUpdatesCount > 0 ? 'rgba(255,255,255,0.7)' : 'var(--ink-60)' }}>
                  {workUpdatesCount > 0
                    ? `${workUpdatesCount} update${workUpdatesCount !== 1 ? 's' : ''} with photo evidence`
                    : 'Add photos of work being done — create accountability'}
                </div>
              </div>
              <TrendingUp size={18} color={workUpdatesCount > 0 ? 'var(--lime)' : 'var(--ink-40)'}/>
            </Link>

            {/* Comments */}
            <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', padding: '20px 24px', boxShadow: 'var(--shadow-sm)', animation: 'fadeInUp 0.5s ease 0.2s both', opacity: 0 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 18 }}>
                Comments ({problem.comments?.length || 0})
              </h3>

              {user ? (
                <div style={{ marginBottom: 20, background: 'var(--surface)', borderRadius: 'var(--r-lg)', padding: 16 }}>
                  <textarea
                    value={comment} onChange={e => setComment(e.target.value)}
                    placeholder="Add a comment or additional information about this problem…"
                    rows={3}
                    style={{ width: '100%', padding: '10px 13px', border: '1.5px solid var(--border-dark)', borderRadius: 'var(--r-md)', fontSize: 13, resize: 'vertical', outline: 'none', marginBottom: 10, boxSizing: 'border-box', fontFamily: 'var(--font-body)', color: 'var(--ink)', transition: 'border-color var(--t-fast)' }}
                    onFocus={e => e.target.style.borderColor='var(--forest)'}
                    onBlur={e => e.target.style.borderColor='var(--border-dark)'}/>
                  <Button variant="primary" size="sm" onClick={handleComment} loading={posting}>
                    <Send size={13}/> {posting ? 'Posting…' : 'Post Comment'}
                  </Button>
                </div>
              ) : (
                <div style={{ marginBottom: 16, padding: '12px 14px', background: 'var(--cream)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--ink-60)', textAlign: 'center' }}>
                  <Link to="/login" style={{ color: 'var(--forest)', fontWeight: 700 }}>Sign in</Link> to add a comment
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {problem.comments?.map((cm, i) => <CommentBubble key={cm.id} comment={cm} index={i}/>)}
                {!problem.comments?.length && (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--ink-40)', fontSize: 14 }}>
                    No comments yet. Be the first to add information.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Sidebar ────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 84 }}>

            {/* Upvote card */}
            <SideCard>
              <button onClick={handleUpvote} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                width: '100%', padding: '14px', borderRadius: 'var(--r-lg)', border: 'none',
                cursor: 'pointer', fontSize: 15, fontWeight: 700,
                background: upvoted ? 'var(--forest)' : 'var(--sage-light)',
                color: upvoted ? 'var(--lime)' : 'var(--forest)',
                transform: upvoteAnim ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                boxShadow: upvoted ? 'var(--shadow-forest)' : 'none',
              }}>
                <ThumbsUp size={18} style={{ transform: upvoteAnim ? 'rotate(-15deg) scale(1.2)' : 'none', transition: 'transform 0.3s ease' }}/>
                {problem.upvotes} Upvotes
              </button>
              <p style={{ fontSize: 11, color: 'var(--ink-60)', textAlign: 'center', marginTop: 8 }}>
                Upvoting raises this problem's priority
              </p>
            </SideCard>

            {/* Reporter info */}
            <SideCard>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-60)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>Reported by</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--forest), var(--forest-mid))', color: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, animation: 'scaleIn 0.4s ease 0.3s both', flexShrink: 0 }}>
                  {problem.reporter_name?.[0] || '?'}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{problem.anonymous ? 'Anonymous' : problem.reporter_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-60)' }}>{problem.reporter_village}, {problem.reporter_district}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-40)' }}>{formatDate(problem.created_at)}</div>
                </div>
              </div>
            </SideCard>

            {/* Status timeline */}
            <SideCard>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-60)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>Status timeline</div>
              {['pending','in_review','in_progress','resolved'].map((st, i) => {
                const cfg     = STATUS_CONFIG[st];
                const reached = ['pending','in_review','in_progress','resolved'].indexOf(problem.status) >= i;
                return (
                  <div key={st} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, animation: `fadeInLeft 0.4s ease ${0.2 + i * 0.08}s both`, opacity: 0 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                      background: reached ? cfg.color : 'var(--border)',
                      boxShadow: reached ? `0 0 0 3px ${cfg.color}33` : 'none',
                      transition: 'all 0.5s ease',
                    }}/>
                    <div style={{ flex: 1, height: 1, background: reached ? cfg.color + '55' : 'var(--border)', display: problem.status !== st ? 'none' : 'block' }}/>
                    <span style={{ fontSize: 12, fontWeight: reached ? 700 : 400, color: reached ? cfg.color : 'var(--ink-40)' }}>
                      {cfg.label}
                    </span>
                    {problem.status === st && <CheckCircle size={13} color={cfg.color}/>}
                  </div>
                );
              })}
            </SideCard>

            {/* Work progress quick view */}
            <SideCard>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-60)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Work Progress</div>
              {workUpdatesCount > 0 ? (
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--forest)', marginBottom: 4 }}>
                    {workUpdatesCount}
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-60)', marginLeft: 4 }}>updates</span>
                  </div>
                  <div className="progress-bar" style={{ marginBottom: 10 }}>
                    <div style={{ height: '100%', width: `${problem.avg_work_completion || 0}%`, background: 'linear-gradient(90deg, var(--forest), var(--lime))', borderRadius: 'var(--r-full)', transition: 'width 1.2s ease' }}/>
                  </div>
                  <Link to={`/problems/${id}/work-progress`} className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                    <Camera size={13}/> View updates
                  </Link>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 12, color: 'var(--ink-60)', marginBottom: 10 }}>No work started yet</p>
                  <Link to={`/problems/${id}/work-progress`} className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                    <Camera size={13}/> Add first update
                  </Link>
                </div>
              )}
            </SideCard>
          </div>
        </div>
      </div>
    </div>
  );
}
