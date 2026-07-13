import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  MapPin, Clock, Eye, ThumbsUp, Send, Sparkles, ArrowLeft, Shield,
  TrendingUp, Camera, Share2, CheckCircle, X, ChevronDown, ChevronUp,
} from 'lucide-react';
import { problemsApi } from '../api/problems.js';
import { adminApi } from '../api/admin.js';
import { useAuth } from '../context/AuthContext.jsx';
import { StatusBadge, SeverityBadge, AIBadge } from '../components/ui/Badge.jsx';
import { PageSpinner } from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { CommentCard } from '../components/shared/CommentCard.jsx';
import PhotoGallery from '../components/shared/PhotoGallery.jsx';
import { DeadlineBadge } from '../components/shared/DeadlineBadge.jsx';
import { STATUS_CONFIG, PRIORITY_CONFIG, formatDate, timeAgo } from '../utils/helpers.js';
import { getError } from '../api/client.js';

export default function ProblemDetail() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [comment, setComment]       = useState('');
  const [posting, setPosting]       = useState(false);
  const [upvoting, setUpvoting]     = useState(false);
  const [galleryIdx, setGalleryIdx] = useState(null);
  const [showAllTags, setShowAllTags] = useState(false);
  const [insight, setInsight]       = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['problem', id],
    queryFn:  () => problemsApi.getById(id).then(r => r.data.data),
  });

  if (isLoading) return <PageSpinner />;
  if (error || !data) return (
    <div className="container-custom py-16">
      <EmptyState emoji="⚠️" title="Could not load problem" description={getError(error)}
        action={<button onClick={() => refetch()} className="btn btn-outline btn-sm">Try again</button>} />
    </div>
  );

  const problem  = data;
  const tags     = problem.ai_tags ? problem.ai_tags.split(',').filter(Boolean) : [];
  const priority = PRIORITY_CONFIG[problem.priority] || PRIORITY_CONFIG.medium;
  const visibleTags = showAllTags ? tags : tags.slice(0, 5);

  const handleUpvote = async () => {
    if (!user) { toast.error('Please sign in to upvote'); return; }
    setUpvoting(true);
    try {
      await problemsApi.upvote(id);
      toast.success('Upvoted! This helps boost priority. 👍');
      queryClient.invalidateQueries({ queryKey: ['problem', id] });
    } catch (err) { toast.error(getError(err)); }
    finally { setUpvoting(false); }
  };

  const handleComment = async () => {
    if (!comment.trim()) { toast.error('Comment cannot be empty'); return; }
    setPosting(true);
    try {
      await problemsApi.comment(id, comment.trim());
      toast.success('Comment posted!');
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['problem', id] });
    } catch (err) { toast.error(getError(err)); }
    finally { setPosting(false); }
  };

  const fetchInsight = async () => {
    setInsightLoading(true);
    try {
      const { data: d } = await adminApi.getInsight(id);
      setInsight(d.insight);
    } catch { toast.error('Could not fetch insight'); }
    finally { setInsightLoading(false); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied!');
  };

  const workUpdatesCount = problem.work_updates_count || 0;

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-16">
      {galleryIdx !== null && (
        <PhotoGallery photos={problem.photos} startIndex={galleryIdx} onClose={() => setGalleryIdx(null)} />
      )}

      {/* Top nav */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-3">
        <div className="container-custom flex items-center justify-between">
          <Link to="/problems" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy no-underline transition-colors">
            <ArrowLeft className="w-[15px] h-[15px]" /> Back to Problems
          </Link>
          <button onClick={copyLink} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy">
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        </div>
      </div>

      <div className="container-custom pt-7">
        <div className="grid lg:grid-cols-[1fr_280px] gap-6 items-start">

          {/* Main column */}
          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
              <div className="flex flex-wrap gap-2 mb-3.5">
                <StatusBadge status={problem.status} />
                {problem.ai_severity_score && <SeverityBadge score={problem.ai_severity_score} />}
                <span className={`badge bg-slate-100 dark:bg-slate-700 ${priority.color}`}>● {priority.label} Priority</span>
                <span className="badge bg-slate-100 dark:bg-slate-700 text-slate-500">{problem.category}</span>
                <DeadlineBadge problemId={problem.id} status={problem.status} />
              </div>

              <h1 className="font-display text-xl md:text-2xl font-extrabold text-ink dark:text-slate-100 leading-snug tracking-tight mb-4">
                {problem.title}
              </h1>

              <div className="flex flex-wrap gap-4 mb-5">
                {[
                  { icon: MapPin, text: `${problem.village}, ${problem.district}, ${problem.state}` },
                  { icon: Clock,  text: timeAgo(problem.created_at) },
                  { icon: Eye,    text: `${problem.views} views` },
                  { icon: ThumbsUp, text: `${problem.upvotes} upvotes` },
                ].map((it, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-[13px] text-slate-500">
                    <it.icon className="w-[13px] h-[13px]" />{it.text}
                  </span>
                ))}
              </div>

              {problem.ai_severity_score && (
                <div className="mb-5">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-500">AI Severity Score</span>
                    <span className="text-xs font-extrabold text-ink dark:text-slate-100">{problem.ai_severity_score}/10</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${problem.ai_severity_score * 10}%` }} transition={{ duration: 1.2 }}
                      className={`h-full rounded-full ${problem.ai_severity_score >= 8 ? 'bg-gradient-to-r from-red-500 to-orange-400' : problem.ai_severity_score >= 5 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-navy to-teal'}`} />
                  </div>
                </div>
              )}

              {problem.ai_summary && (
                <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-2xl p-4 mb-5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-violet-500 animate-pulse-dot" />
                    <span className="text-[11px] font-extrabold text-violet-600 uppercase tracking-wide">AI Summary — Groq llama3-8b</span>
                    <AIBadge />
                  </div>
                  <p className="text-sm text-violet-800 dark:text-violet-300 leading-relaxed italic mb-3">{problem.ai_summary}</p>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {visibleTags.map((t, i) => (
                        <span key={i} className="badge bg-violet-100 text-violet-700">{t.trim()}</span>
                      ))}
                      {tags.length > 5 && (
                        <button onClick={() => setShowAllTags(!showAllTags)} className="text-[11px] font-semibold text-violet-600 flex items-center gap-0.5">
                          {showAllTags ? <><ChevronUp className="w-3 h-3" /> less</> : <><ChevronDown className="w-3 h-3" /> +{tags.length - 5} more</>}
                        </button>
                      )}
                    </div>
                  )}
                  {problem.ai_responsible_dept && (
                    <div className="mt-2.5 text-xs text-violet-600 font-semibold">📋 Responsible dept: {problem.ai_responsible_dept}</div>
                  )}
                </div>
              )}

              <div className="mb-1">
                <h3 className="text-[15px] font-bold text-ink dark:text-slate-100 mb-2.5">Full Description</h3>
                <p className="text-sm text-ink dark:text-slate-300 leading-relaxed">{problem.description}</p>
              </div>

              {problem.budget_estimate && (
                <div className="mt-4 flex items-center gap-2 px-3.5 py-2.5 bg-amber-50 rounded-xl text-sm text-amber-700 font-semibold">
                  ⚠️ Estimated cost to fix: ₹{Number(problem.budget_estimate).toLocaleString('en-IN')}
                </div>
              )}

              {problem.admin_notes && (
                <div className="mt-5 bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <div className="flex items-center gap-1.5 mb-2 text-[11px] font-extrabold text-blue-700 uppercase tracking-wide">
                    <Shield className="w-3.5 h-3.5" /> Official Response
                  </div>
                  <p className="text-sm text-blue-900 leading-relaxed">{problem.admin_notes}</p>
                </div>
              )}

              {isAdmin && (
                <div className="mt-5 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="text-[11px] font-extrabold text-amber-700 uppercase tracking-wide mb-2.5">🤖 Groq Admin Insight</div>
                  {insight
                    ? <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-amber-800 leading-relaxed">{insight}</motion.p>
                    : <button onClick={fetchInsight} disabled={insightLoading} className="btn btn-ghost btn-sm">
                        {insightLoading ? 'Loading…' : <><Sparkles className="w-3.5 h-3.5" /> Get AI action suggestion</>}
                      </button>}
                </div>
              )}
            </motion.div>

            {/* Photos */}
            {problem.photos?.length > 0 && (
              <div className="card p-5">
                <h3 className="text-[15px] font-bold text-ink dark:text-slate-100 mb-3.5">Photos ({problem.photos.length})</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {problem.photos.map((ph, i) => (
                    <button key={ph.id} onClick={() => setGalleryIdx(i)}
                      className="aspect-square rounded-xl overflow-hidden bg-slate-100 relative group">
                      <img src={ph.s3_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={e => e.target.style.display = 'none'} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Work progress link */}
            <Link to={`/problems/${id}/work-progress`}
              className={`flex items-center gap-3.5 p-4.5 rounded-2xl no-underline border transition-all duration-200 hover:-translate-y-0.5 ${workUpdatesCount > 0 ? 'bg-gradient-to-br from-navy to-navy-light border-navy' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${workUpdatesCount > 0 ? 'bg-teal/20' : 'bg-teal/10'}`}>
                <Camera className={`w-5 h-5 ${workUpdatesCount > 0 ? 'text-teal' : 'text-navy'}`} />
              </div>
              <div className="flex-1">
                <div className={`text-[15px] font-bold ${workUpdatesCount > 0 ? 'text-white' : 'text-ink dark:text-slate-100'}`}>Work Progress Tracker</div>
                <div className={`text-[13px] ${workUpdatesCount > 0 ? 'text-white/70' : 'text-slate-500'}`}>
                  {workUpdatesCount > 0 ? `${workUpdatesCount} update${workUpdatesCount !== 1 ? 's' : ''} with photo evidence` : 'Add photos of work being done'}
                </div>
              </div>
              <TrendingUp className={`w-[18px] h-[18px] ${workUpdatesCount > 0 ? 'text-teal' : 'text-slate-300'}`} />
            </Link>

            {/* Comments */}
            <div className="card p-5">
              <h3 className="text-[15px] font-bold text-ink dark:text-slate-100 mb-4.5">Comments ({problem.comments?.length || 0})</h3>
              {user ? (
                <div className="mb-5 bg-slate-50 dark:bg-slate-700 rounded-2xl p-4">
                  <textarea value={comment} onChange={e => setComment(e.target.value)}
                    placeholder="Add a comment or additional information…"
                    rows={3} className="input mb-2.5 resize-none" />
                  <button onClick={handleComment} disabled={posting} className="btn btn-navy btn-sm">
                    <Send className="w-3.5 h-3.5" /> {posting ? 'Posting…' : 'Post Comment'}
                  </button>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-slate-50 rounded-xl text-sm text-slate-500 text-center">
                  <Link to="/login" className="text-navy font-bold no-underline">Sign in</Link> to add a comment
                </div>
              )}
              <div className="space-y-2.5">
                {problem.comments?.map((cm, i) => <CommentCard key={cm.id} comment={cm} index={i} />)}
                {!problem.comments?.length && <div className="text-center py-6 text-slate-400 text-sm">No comments yet.</div>}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-3.5 lg:sticky lg:top-24">
            <div className="card p-4">
              <button onClick={handleUpvote} disabled={upvoting}
                className="w-full py-3.5 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 bg-teal/15 text-navy hover:bg-navy hover:text-teal transition-all duration-300">
                <ThumbsUp className="w-[18px] h-[18px]" /> {problem.upvotes} Upvotes
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-2">Upvoting raises this problem's priority</p>
            </div>

            <div className="card p-4">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-3.5">Reported by</div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy to-navy-mid text-teal flex items-center justify-center text-lg font-bold flex-shrink-0">
                  {problem.reporter_name?.[0] || '?'}
                </div>
                <div>
                  <div className="text-sm font-bold text-ink dark:text-slate-100">{problem.anonymous ? 'Anonymous' : problem.reporter_name}</div>
                  <div className="text-xs text-slate-400">{problem.reporter_village}, {problem.reporter_district}</div>
                  <div className="text-[11px] text-slate-300">{formatDate(problem.created_at)}</div>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-4">Status timeline</div>
              {['pending', 'in_review', 'in_progress', 'resolved'].map((st, i) => {
                const cfg     = STATUS_CONFIG[st];
                const order   = ['pending', 'in_review', 'in_progress', 'resolved'];
                const reached = order.indexOf(problem.status) >= i;
                return (
                  <div key={st} className="flex items-center gap-2.5 mb-3">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 badge ${reached ? cfg.tw : 'bg-slate-200'} !p-0 !w-2.5 !h-2.5`} />
                    <span className={`text-xs ${reached ? 'font-bold' : 'text-slate-400'}`}>{cfg.label}</span>
                    {problem.status === st && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto" />}
                  </div>
                );
              })}
            </div>

            <div className="card p-4">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-3">Work Progress</div>
              {workUpdatesCount > 0 ? (
                <div>
                  <div className="font-display text-2xl font-extrabold text-navy mb-1">
                    {workUpdatesCount} <span className="text-sm font-medium text-slate-400">updates</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2.5">
                    <div className="h-full bg-gradient-to-r from-navy to-teal rounded-full" style={{ width: `${problem.avg_work_completion || 0}%` }} />
                  </div>
                  <Link to={`/problems/${id}/work-progress`} className="btn btn-navy btn-sm w-full justify-center">
                    <Camera className="w-3.5 h-3.5" /> View updates
                  </Link>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-slate-400 mb-2.5">No work started yet</p>
                  <Link to={`/problems/${id}/work-progress`} className="btn btn-outline btn-sm w-full justify-center">
                    <Camera className="w-3.5 h-3.5" /> Add first update
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
