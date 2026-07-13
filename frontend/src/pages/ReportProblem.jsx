import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  CheckCircle, MapPin, Sparkles, Cpu, ChevronRight, Shield,
  Loader2, FileText, Star,
} from 'lucide-react';
import { problemsApi, categoriesApi } from '../api/problems.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getError } from '../api/client.js';
import { INDIA_STATES, CAT_EMOJI } from '../utils/helpers.js';
import ImageUpload from '../components/ui/ImageUpload.jsx';

const STEPS = [
  { label: 'Category', icon: Star },
  { label: 'Details',  icon: FileText },
  { label: 'Location', icon: MapPin },
  { label: 'Submit',   icon: CheckCircle },
];

function StepBar({ step }) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((s, i) => {
        const done   = step > i + 1;
        const active = step === i + 1;
        const Icon   = s.icon;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <motion.div animate={{ scale: active ? 1.12 : 1 }}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-[13px] transition-colors duration-300 ${
                  done ? 'bg-teal text-navy' : active ? 'bg-navy text-teal shadow-navy' : 'bg-slate-200 text-slate-400'
                }`}>
                {done ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-[15px] h-[15px]" />}
              </motion.div>
              <span className={`text-[10px] whitespace-nowrap ${active ? 'font-bold text-navy' : 'text-slate-400'}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1.5 mb-5 rounded transition-colors duration-400 ${done ? 'bg-teal' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function CatButton({ cat, selected, onClick }) {
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border-2 transition-all duration-200 ${
        selected ? 'scale-105' : 'hover:scale-[1.02] hover:border-slate-300'
      }`}
      style={{
        borderColor: selected ? cat.color : '#E2E8F0',
        background: selected ? `${cat.color}12` : '#fff',
        boxShadow: selected ? `0 4px 16px ${cat.color}28` : 'none',
      }}>
      <motion.span animate={{ rotate: selected ? -6 : 0, scale: selected ? 1.15 : 1 }} className="text-2xl">
        {CAT_EMOJI[cat.name] || '📋'}
      </motion.span>
      <span className="text-[11px] font-semibold text-center leading-tight" style={{ color: selected ? cat.color : '#64748B' }}>
        {cat.name}
      </span>
    </button>
  );
}

export default function ReportProblem() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [step, setStep]           = useState(1);
  const [photos, setPhotos]       = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category_id: '',
    state: user?.state || '', district: user?.district || '', village: user?.village || '',
    pincode: '', anonymous: false, budget_estimate: '',
  });

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => categoriesApi.getAll().then(r => r.data),
  });
  const categories = catData?.data || [];

  const onChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const validate = () => {
    if (step === 1 && !form.category_id) { toast.error('Please select a category'); return false; }
    if (step === 2 && form.title.trim().length < 10) { toast.error('Title needs at least 10 characters'); return false; }
    if (step === 2 && form.description.trim().length < 20) { toast.error('Description needs at least 20 characters'); return false; }
    if (step === 3 && (!form.state || !form.district || !form.village)) { toast.error('Fill in all location fields'); return false; }
    return true;
  };

  const next = () => { if (validate()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const submit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      photos.forEach(p => fd.append('photos', p.file));
      const { data } = await problemsApi.create(fd);
      toast.success('Report submitted! Groq AI is analysing it now… ✨');
      navigate(`/problems/${data.problemId}`);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const selCat = categories.find(c => String(c.id) === String(form.category_id));

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-16">
      <div className="bg-gradient-to-br from-navy to-navy-light py-7 md:py-10">
        <div className="container-custom text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-teal/15 border border-teal/30 rounded-full px-3.5 py-1 text-[11px] font-bold text-teal mb-3.5">
            <Cpu className="w-3 h-3 animate-pulse-dot" /> Groq AI will analyse your report
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-1.5">Report a Problem</h1>
          <p className="text-[13px] text-white/65">Your report will be AI-scored for severity and forwarded to the right authorities</p>
        </div>
      </div>

      <div className="container-custom -mt-6 relative z-10 max-w-2xl mx-auto">
        <div className="card overflow-hidden">
          <div className="p-6 md:p-7 pb-0"><StepBar step={step} /></div>

          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
              className="p-6 md:p-7 pt-0">

              {step === 1 && (
                <>
                  <h2 className="font-display text-xl font-extrabold text-ink dark:text-slate-100 mb-1.5">What type of problem?</h2>
                  <p className="text-[13px] text-slate-400 mb-5.5">Pick the category that best describes the issue</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-6">
                    {categories.map(cat => (
                      <CatButton key={cat.id} cat={cat} selected={String(form.category_id) === String(cat.id)}
                        onClick={() => setForm(f => ({ ...f, category_id: cat.id }))} />
                    ))}
                  </div>
                  <button onClick={next} className="btn btn-navy w-full justify-center py-3">
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="flex items-center gap-2.5 mb-5">
                    {selCat && (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${selCat.color}18` }}>
                        {CAT_EMOJI[selCat.name] || '📋'}
                      </div>
                    )}
                    <div>
                      <h2 className="font-display text-xl font-extrabold text-ink dark:text-slate-100">Describe the problem</h2>
                      <span className="text-xs font-semibold" style={{ color: selCat?.color }}>{selCat?.name}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="input-label">Problem Title *</label>
                      <input name="title" value={form.title} onChange={onChange} maxLength={255}
                        placeholder="e.g. No drinking water for 3 days in Rampur village" className="input" />
                      <div className="text-[11px] text-slate-400 text-right mt-1">{form.title.length}/255</div>
                    </div>

                    <div>
                      <label className="input-label">Detailed Description *</label>
                      <textarea name="description" value={form.description} onChange={onChange} maxLength={3000} rows={5}
                        placeholder="When did it start? How many people affected? What have you tried?" className="input resize-y" />
                      <div className="text-[11px] text-slate-400 text-right mt-1">{form.description.length}/3000</div>
                    </div>

                    <div>
                      <label className="input-label">Estimated cost to fix (₹, optional)</label>
                      <input name="budget_estimate" type="number" value={form.budget_estimate} onChange={onChange}
                        placeholder="e.g. 50000" className="input" />
                    </div>

                    <ImageUpload value={photos} onChange={setPhotos} label="Photos (up to 5) — strongly recommended" />

                    <button type="button" onClick={() => setForm(f => ({ ...f, anonymous: !f.anonymous }))}
                      className={`flex items-center gap-3 w-full p-3.5 rounded-2xl border-2 transition-all duration-200 ${form.anonymous ? 'bg-navy border-navy' : 'bg-slate-50 border-slate-200'}`}>
                      <Shield className={`w-4 h-4 ${form.anonymous ? 'text-teal' : 'text-slate-400'}`} />
                      <div className="flex-1 text-left">
                        <div className={`text-[13px] font-semibold ${form.anonymous ? 'text-white' : 'text-ink'}`}>
                          {form.anonymous ? '🔒 Anonymous mode ON' : 'Submit anonymously'}
                        </div>
                        <div className={`text-[11px] ${form.anonymous ? 'text-white/65' : 'text-slate-400'}`}>Your name won't appear on this report</div>
                      </div>
                      <div className={`w-10 h-5.5 rounded-full relative flex-shrink-0 transition-colors ${form.anonymous ? 'bg-teal' : 'bg-slate-300'}`}>
                        <motion.div layout className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow" animate={{ left: form.anonymous ? 21 : 3 }} />
                      </div>
                    </button>

                    {form.description.length >= 20 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex gap-2 items-center bg-violet-50 border border-violet-200 rounded-xl px-3.5 py-2.5">
                        <Sparkles className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 animate-pulse-dot" />
                        <span className="text-xs text-violet-600 font-medium">Groq AI will score severity, write a summary, extract tags, and suggest the responsible department</span>
                      </motion.div>
                    )}
                  </div>

                  <div className="flex gap-2.5 mt-6">
                    <button onClick={back} className="btn btn-ghost">← Back</button>
                    <button onClick={next} className="btn btn-navy flex-1 justify-center">Continue <ChevronRight className="w-4 h-4" /></button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h2 className="font-display text-xl font-extrabold text-ink dark:text-slate-100 mb-1.5">Where is this happening?</h2>
                  <p className="text-[13px] text-slate-400 mb-5.5">Precise location helps officials respond faster</p>

                  <div className="grid grid-cols-2 gap-3.5 mb-6">
                    <div className="col-span-2">
                      <label className="input-label">State *</label>
                      <select name="state" value={form.state} onChange={onChange} className="input">
                        <option value="">Select state…</option>
                        {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="input-label">District *</label>
                      <input name="district" value={form.district} onChange={onChange} placeholder="e.g. Varanasi" className="input" />
                    </div>
                    <div>
                      <label className="input-label">Village / Town *</label>
                      <input name="village" value={form.village} onChange={onChange} placeholder="e.g. Rampur" className="input" />
                    </div>
                    <div>
                      <label className="input-label">PIN Code</label>
                      <input name="pincode" value={form.pincode} onChange={onChange} maxLength={6} placeholder="221001" className="input" />
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <button onClick={back} className="btn btn-ghost">← Back</button>
                    <button onClick={next} className="btn btn-navy flex-1 justify-center">Review & Submit <ChevronRight className="w-4 h-4" /></button>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <h2 className="font-display text-xl font-extrabold text-ink dark:text-slate-100 mb-5">Review your report</h2>

                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 mb-5">
                    {selCat && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3" style={{ background: `${selCat.color}18`, color: selCat.color }}>
                        {CAT_EMOJI[selCat.name]} {selCat.name}
                      </span>
                    )}
                    <h3 className="text-[17px] font-bold text-ink mb-2">{form.title}</h3>
                    <p className="text-[13px] text-slate-500 leading-relaxed mb-3">{form.description}</p>
                    <div className="flex items-center gap-1.5 text-[13px] text-slate-500 mb-3">
                      <MapPin className="w-3.5 h-3.5" /> {form.village}, {form.district}, {form.state} {form.pincode}
                    </div>
                    {form.anonymous && (
                      <div className="flex items-center gap-1.5 text-xs text-navy font-semibold">
                        <Shield className="w-3.5 h-3.5" /> Anonymous submission
                      </div>
                    )}
                    {photos.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-3.5">
                        {photos.map(p => <img key={p.id} src={p.preview} alt="" className="w-16 h-16 rounded-xl object-cover border-2 border-teal/40" />)}
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl p-4.5 mb-6">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                      <span className="text-[11px] font-extrabold text-violet-600 uppercase tracking-wide">What happens after you submit</span>
                    </div>
                    {['Groq AI (llama3-8b) scores severity 1–10 in under 2 seconds', 'An official summary is generated for government officials', 'Tags and responsible department are auto-identified', 'Your report appears in the live public feed immediately'].map((item, i) => (
                      <div key={i} className="flex items-start gap-2 mb-1.5 last:mb-0">
                        <div className="w-4.5 h-4.5 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
                        <span className="text-xs text-violet-700 leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2.5">
                    <button onClick={back} className="btn btn-ghost">← Back</button>
                    <button onClick={submit} disabled={submitting} className="btn btn-teal flex-1 justify-center py-3">
                      {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Groq is analysing…</> : '🚀 Submit Report'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
