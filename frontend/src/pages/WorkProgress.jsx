import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Camera, ArrowLeft, MapPin, Sparkles, ThumbsUp, Shield, Flag, Loader2 } from 'lucide-react';
import { problemsApi } from '../api/problems.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getError } from '../api/client.js';
import { PageSpinner } from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { AIBadge } from '../components/ui/Badge.jsx';
import ImageUpload from '../components/ui/ImageUpload.jsx';
import PhotoGallery from '../components/shared/PhotoGallery.jsx';
import { timeAgo } from '../utils/helpers.js';

function UploadForm({ problemId, onSuccess }) {
  const [photos, setPhotos]     = useState([]);
  const [desc, setDesc]         = useState('');
  const [location, setLocation] = useState('');
  const [pct, setPct]           = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!desc.trim())        { toast.error('Please describe the work update'); return; }
    if (photos.length === 0) { toast.error('Please upload at least one photo'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('description', desc);
      fd.append('location_name', location);
      fd.append('work_completion_pct', pct || '');
      photos.forEach(p => fd.append('photos', p.file));
      await problemsApi.addWorkUpdate(problemId, fd);
      toast.success('Work update submitted! Groq AI is analysing your photos…');
      onSuccess();
      setPhotos([]); setDesc(''); setLocation(''); setPct('');
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center flex-shrink-0">
          <Camera className="w-[18px] h-[18px] text-teal" />
        </div>
        <div>
          <div className="text-[15px] font-bold text-ink dark:text-slate-100">Submit Work Update</div>
          <div className="text-xs text-slate-400">Upload photos + description · Groq AI will verify progress</div>
        </div>
      </div>

      <ImageUpload value={photos} onChange={setPhotos} label="Photos * (up to 5)" />

      <div className="mt-4">
        <label className="input-label">Work Description *</label>
        <textarea value={desc} onChange={e => setDesc(e.target.value)} maxLength={1000} rows={4}
          placeholder="Describe what work was done, what stage it's at, any issues…" className="input resize-y" />
      </div>

      <div className="grid grid-cols-2 gap-3.5 mt-4">
        <div>
          <label className="input-label">Location (optional)</label>
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Near Shiva temple" className="input" />
        </div>
        <div>
          <label className="input-label">Completion % (optional)</label>
          <input type="number" min="0" max="100" value={pct} onChange={e => setPct(e.target.value)} placeholder="e.g. 40" className="input" />
        </div>
      </div>

      <div className="flex gap-2 items-center bg-violet-50 rounded-xl px-3.5 py-2.5 mt-4">
        <Sparkles className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 animate-pulse-dot" />
        <span className="text-xs text-violet-600 font-medium">Groq AI will analyse your photos and estimate work completion % automatically</span>
      </div>

      <button onClick={submit} disabled={submitting} className="btn btn-navy w-full justify-center mt-5 py-3">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        Submit Work Update
      </button>
    </motion.div>
  );
}

function UpdateCard({ update, index, isAdmin, onVerify, onFlag }) {
  const [galleryIdx, setGalleryIdx] = useState(null);
  const statusColor = {
    submitted: 'text-amber-600 bg-amber-50', ai_verified: 'text-violet-600 bg-violet-50',
    approved: 'text-emerald-600 bg-emerald-50', disputed: 'text-red-600 bg-red-50',
  }[update.status] || 'text-slate-500 bg-slate-100';

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.08 }}
      className="card overflow-hidden">
      {galleryIdx !== null && <PhotoGallery photos={update.photos} startIndex={galleryIdx} onClose={() => setGalleryIdx(null)} />}

      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-700">
        <div className="w-9 h-9 rounded-full bg-navy text-teal flex items-center justify-center font-bold text-sm flex-shrink-0">
          {update.reporter_name?.[0] || '?'}
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-bold text-ink dark:text-slate-100">{update.reporter_name}</div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            {timeAgo(update.created_at)} {update.location_name && <>· <MapPin className="w-2.5 h-2.5" />{update.location_name}</>}
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusColor}`}>
          {update.status === 'ai_verified' ? '✦ AI Verified' : update.status === 'approved' ? '✓ Approved' : update.status === 'disputed' ? '⚠ Disputed' : 'Submitted'}
        </span>
      </div>

      {update.photos?.length > 0 && (
        <div className="grid grid-cols-3 gap-0.5">
          {update.photos.slice(0, 3).map((ph, i) => (
            <button key={i} onClick={() => setGalleryIdx(i)} className="relative pb-[60%] bg-slate-100 overflow-hidden">
              <img src={ph.url} alt="" className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300" onError={e => e.target.style.display = 'none'} />
              {i === 2 && update.photos.length > 3 && (
                <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white text-lg font-bold">+{update.photos.length - 3}</div>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="p-5">
        <p className="text-sm text-ink dark:text-slate-300 leading-relaxed mb-3">{update.description}</p>

        {update.ai_analysis && (
          <div className="bg-violet-50 rounded-xl p-3.5 mb-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <AIBadge label="Groq Analysis" />
              {update.ai_work_completion_pct !== null && (
                <span className="text-[11px] font-bold text-violet-600">{update.ai_work_completion_pct}% work completed (estimated)</span>
              )}
            </div>
            <p className="text-xs text-violet-700 italic leading-relaxed">{update.ai_analysis}</p>
          </div>
        )}

        {update.ai_work_completion_pct !== null && (
          <div className="mb-3">
            <div className="flex justify-between text-[11px] text-slate-500 mb-1.5">
              <span className="font-semibold">Work completion</span>
              <span className="font-bold text-navy">{update.ai_work_completion_pct}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${update.ai_work_completion_pct}%` }} transition={{ duration: 1.2 }}
                className="h-full bg-gradient-to-r from-navy to-teal rounded-full" />
            </div>
          </div>
        )}

        <div className="flex gap-2 items-center flex-wrap">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-teal/10 hover:text-navy transition-colors">
            <ThumbsUp className="w-3 h-3" />{update.helpful_votes || 0} Helpful
          </button>
          {isAdmin && update.status === 'submitted' && (
            <button onClick={() => onVerify(update.id)} className="btn btn-teal btn-sm"><Shield className="w-3 h-3" /> Approve</button>
          )}
          {isAdmin && (
            <button onClick={() => onFlag(update.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-xs font-semibold text-red-600">
              <Flag className="w-3 h-3" /> Dispute
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function WorkProgress() {
  const { id }      = useParams();
  const { user, isAdmin } = useAuth();
  const queryClient  = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: problem, isLoading: probLoading } = useQuery({
    queryKey: ['problem', id], queryFn: () => problemsApi.getById(id).then(r => r.data.data),
  });
  const { data: updatesData, isLoading: updLoading } = useQuery({
    queryKey: ['work-updates', id], queryFn: () => problemsApi.getWorkUpdates(id).then(r => r.data),
  });

  const updates = updatesData?.data || [];
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['work-updates', id] });
    queryClient.invalidateQueries({ queryKey: ['problem', id] });
  };

  const handleVerify = async (updateId) => { await problemsApi.approveUpdate(updateId); toast.success('Update approved'); invalidate(); };
  const handleFlag   = async (updateId) => { await problemsApi.disputeUpdate(updateId); toast.success('Marked as disputed'); invalidate(); };

  if (probLoading || updLoading) return <PageSpinner />;

  const totalPct = updates.length > 0
    ? Math.round(updates.filter(u => u.ai_work_completion_pct).reduce((s, u) => s + u.ai_work_completion_pct, 0) / (updates.filter(u => u.ai_work_completion_pct).length || 1))
    : 0;

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen py-6 pb-16">
      <div className="container-custom max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Link to={`/problems/${id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy no-underline">
            <ArrowLeft className="w-[15px] h-[15px]" /> Back to problem
          </Link>
          <span className="text-slate-300">·</span>
          <span className="text-sm text-slate-400">Work Progress</span>
        </div>

        {problem && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-navy to-navy-light rounded-2xl p-6 mb-7 text-white">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1">
                <div className="text-[11px] font-extrabold text-teal uppercase tracking-wide mb-1.5">Work Progress Tracker</div>
                <h1 className="font-display text-lg md:text-xl font-extrabold mb-2 tracking-tight">{problem.title}</h1>
                <div className="flex items-center gap-1.5 text-xs text-white/70">
                  <MapPin className="w-3 h-3" />{problem.village}, {problem.district}
                </div>
              </div>
              <div className="text-center flex-shrink-0">
                <div className="relative w-20 h-20">
                  <svg width={80} height={80} className="-rotate-90">
                    <circle cx={40} cy={40} r={32} stroke="rgba(255,255,255,0.15)" strokeWidth={6} fill="none" />
                    <motion.circle cx={40} cy={40} r={32} stroke="#00D4B2" strokeWidth={6} fill="none"
                      strokeDasharray={201} strokeLinecap="round"
                      initial={{ strokeDashoffset: 201 }} animate={{ strokeDashoffset: 201 - (totalPct / 100) * 201 }}
                      transition={{ duration: 1.5 }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-lg font-extrabold">{totalPct}</span>
                    <span className="text-[9px] text-white/70">% done</span>
                  </div>
                </div>
                <div className="text-[11px] text-white/70 mt-1.5">AI estimate</div>
              </div>
            </div>

            <div className="flex gap-6 mt-5 pt-4 border-t border-white/15 flex-wrap">
              {[{ label: 'Updates', val: updates.length }, { label: 'AI Verified', val: updates.filter(u => u.status === 'ai_verified' || u.status === 'approved').length }, { label: 'Photos', val: updates.reduce((s, u) => s + (u.photos?.length || 0), 0) }].map(s => (
                <div key={s.label}>
                  <div className="font-display text-xl font-extrabold text-teal">{s.val}</div>
                  <div className="text-[11px] text-white/65">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {user && problem?.status !== 'resolved' && (
          <div className="mb-6">
            {!showForm ? (
              <button onClick={() => setShowForm(true)}
                className="flex items-center gap-2.5 w-full p-4 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 rounded-2xl hover:border-navy hover:bg-teal/5 transition-all duration-200 text-left">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Camera className="w-[18px] h-[18px] text-slate-500" />
                </div>
                <div>
                  <div className="text-sm font-bold text-ink dark:text-slate-100">Submit a work update</div>
                  <div className="text-xs text-slate-500">Upload photos of progress · Groq AI will verify and estimate completion %</div>
                </div>
              </button>
            ) : (
              <UploadForm problemId={id} onSuccess={() => { setShowForm(false); invalidate(); }} />
            )}
          </div>
        )}

        <h2 className="font-display text-lg font-extrabold text-ink dark:text-slate-100 mb-4">
          Progress Timeline <span className="text-sm font-medium text-slate-400">{updates.length} update{updates.length !== 1 ? 's' : ''}</span>
        </h2>

        {updates.length === 0 ? (
          <EmptyState emoji="📸" title="No work updates yet" description="Be the first to document the work being done on this problem."
            action={user && <button onClick={() => setShowForm(true)} className="btn btn-navy"><Camera className="w-4 h-4" /> Add First Update</button>} />
        ) : (
          <div className="space-y-4">
            {updates.map((u, i) => <UpdateCard key={u.id} update={u} index={i} isAdmin={isAdmin} onVerify={handleVerify} onFlag={handleFlag} />)}
          </div>
        )}
      </div>
    </div>
  );
}
