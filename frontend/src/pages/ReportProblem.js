// src/pages/ReportProblem.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  Upload, X, CheckCircle, MapPin, Sparkles,
  Cpu, ChevronRight, Shield, AlertTriangle,
  Loader, Camera, FileText, Star,
} from 'lucide-react';
import api, { getError } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { INDIA_STATES, CAT_EMOJI } from '../utils/helpers';
import { Button } from '../components/ui';
import toast from 'react-hot-toast';

const STEPS = [
  { label: 'Category',  icon: <Star size={14}/> },
  { label: 'Details',   icon: <FileText size={14}/> },
  { label: 'Location',  icon: <MapPin size={14}/> },
  { label: 'Submit',    icon: <CheckCircle size={14}/> },
];

/* ── Step indicator ─────────────────────────────────────────── */
function StepBar({ step }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
      {STEPS.map((s, i) => {
        const done   = step > i + 1;
        const active = step === i + 1;
        return (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: done ? 'var(--lime)' : active ? 'var(--forest)' : 'var(--border)',
                color: done ? 'var(--forest)' : active ? 'var(--lime)' : 'var(--ink-40)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 13,
                boxShadow: active ? `0 0 0 4px rgba(10,61,31,0.15)` : 'none',
                transform: active ? 'scale(1.12)' : 'scale(1)',
                transition: 'all 0.35s cubic-bezier(0.34,1.3,0.64,1)',
              }}>
                {done ? <CheckCircle size={16}/> : s.icon}
              </div>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? 'var(--forest)' : 'var(--ink-40)', whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: '0 6px 20px',
                background: done ? 'var(--lime)' : 'var(--border)',
                borderRadius: 2, transition: 'background 0.4s ease',
              }}/>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ── Category selector card ─────────────────────────────────── */
function CatButton({ cat, selected, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        padding: '14px 10px', borderRadius: 'var(--r-lg)',
        border: `${selected ? 2 : 1.5}px solid ${selected ? cat.color : hov ? 'var(--border-dark)' : 'var(--border)'}`,
        background: selected ? cat.color + '12' : hov ? 'var(--surface)' : '#fff',
        cursor: 'pointer', textAlign: 'center',
        transform: selected ? 'scale(1.05)' : hov ? 'scale(1.02)' : 'scale(1)',
        boxShadow: selected ? `0 4px 16px ${cat.color}28` : hov ? 'var(--shadow-sm)' : 'none',
        transition: 'all 0.22s cubic-bezier(0.34,1.3,0.64,1)',
      }}>
      <span style={{
        fontSize: 26,
        transform: selected ? 'rotate(-6deg) scale(1.15)' : 'scale(1)',
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        display: 'inline-block',
      }}>
        {CAT_EMOJI[cat.name] || '📋'}
      </span>
      <span style={{ fontSize: 11, fontWeight: selected ? 700 : 500, color: selected ? cat.color : 'var(--ink-60)', lineHeight: 1.3 }}>
        {cat.name}
      </span>
    </button>
  );
}

/* ── Photo dropzone ─────────────────────────────────────────── */
function PhotoZone({ photos, previews, onDrop, onRemove, maxPhotos = 5 }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.jpg','.jpeg','.png','.webp'] },
    maxSize: 8 * 1024 * 1024, disabled: photos.length >= maxPhotos,
    onDropRejected: () => toast.error('Max 8 MB per image. JPG/PNG/WEBP only.'),
  });

  return (
    <div>
      <div {...getRootProps()} style={{
        border: `2px dashed ${isDragActive ? 'var(--forest)' : 'var(--border-dark)'}`,
        borderRadius: 'var(--r-lg)', padding: '28px 20px', textAlign: 'center',
        cursor: photos.length >= maxPhotos ? 'not-allowed' : 'pointer',
        background: isDragActive ? 'var(--sage-light)' : 'var(--surface)',
        transition: 'all 0.2s ease',
        transform: isDragActive ? 'scale(1.01)' : 'scale(1)',
      }}>
        <input {...getInputProps()}/>
        <div style={{
          width: 48, height: 48, borderRadius: 'var(--r-md)',
          background: isDragActive ? 'var(--sage)' : 'var(--cream-dark)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px',
          transition: 'background 0.2s',
        }}>
          <Upload size={22} color={isDragActive ? 'var(--forest)' : 'var(--ink-40)'}/>
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: isDragActive ? 'var(--forest)' : 'var(--ink-60)', margin: '0 0 4px' }}>
          {isDragActive ? 'Release to upload…' : 'Drag & drop or click to add photos'}
        </p>
        <p style={{ fontSize: 12, color: 'var(--ink-40)', margin: 0 }}>
          JPG · PNG · WEBP · Max 8 MB · {maxPhotos - photos.length} remaining
        </p>
      </div>

      {previews.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
          {previews.map((src, i) => (
            <div key={i} style={{ position: 'relative', animation: 'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both' }}>
              <img src={src} alt="" style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: 'var(--r-md)', border: '2px solid var(--sage)', display: 'block' }}/>
              <button onClick={() => onRemove(i)} style={{
                position: 'absolute', top: -7, right: -7, width: 22, height: 22,
                borderRadius: '50%', background: 'var(--danger)', border: '2px solid #fff',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'transform 0.2s ease',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <X size={11} color="#fff"/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main report form ───────────────────────────────────────── */
export default function ReportProblem() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [categories, setCategories] = useState([]);
  const [photos,     setPhotos]     = useState([]);
  const [previews,   setPreviews]   = useState([]);
  const [step,       setStep]       = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category_id: '',
    state:    user?.state    || '',
    district: user?.district || '',
    village:  user?.village  || '',
    pincode:  '',
    anonymous: false,
    budget_estimate: '',
  });

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data || []));
  }, []);

  const onChange = e => setForm(f => ({
    ...f,
    [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
  }));

  const onDrop = useCallback((accepted) => {
    const rem   = 5 - photos.length;
    const files = accepted.slice(0, rem);
    setPhotos(p => [...p, ...files]);
    files.forEach(f => {
      const r = new FileReader();
      r.onload = e => setPreviews(p => [...p, e.target.result]);
      r.readAsDataURL(f);
    });
  }, [photos]);

  const removePhoto = i => {
    setPhotos(p   => p.filter((_,idx) => idx !== i));
    setPreviews(p => p.filter((_,idx) => idx !== i));
  };

  const validate = () => {
    if (step === 1 && !form.category_id)                 { toast.error('Please select a category'); return false; }
    if (step === 2 && form.title.trim().length < 10)     { toast.error('Title needs at least 10 characters'); return false; }
    if (step === 2 && form.description.trim().length < 20){ toast.error('Description needs at least 20 characters'); return false; }
    if (step === 3 && (!form.state || !form.district || !form.village)) { toast.error('Fill in all location fields'); return false; }
    return true;
  };

  const next = () => { if (validate()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const submit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k, String(v)));
      photos.forEach(f => fd.append('photos', f));
      const { data } = await api.post('/problems', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Report submitted! Groq AI is analysing it now… ✨');
      navigate(`/problems/${data.problemId}`);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const selCat = categories.find(c => String(c.id) === String(form.category_id));
  const inputSt = { width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: 'var(--r-md)', fontSize: 14, color: 'var(--ink)', outline: 'none', fontFamily: 'var(--font-body)', background: '#fff', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s' };
  const handleFocus = e => { e.target.style.borderColor = 'var(--forest)'; e.target.style.boxShadow = '0 0 0 3px rgba(10,61,31,0.1)'; };
  const handleBlur  = e => { e.target.style.borderColor = 'var(--border-dark)'; e.target.style.boxShadow = 'none'; };

  return (
    <div className="page-enter" style={{ background: 'var(--surface)', minHeight: '100vh', padding: '0 0 60px' }}>
      {/* Header strip */}
      <div style={{ background: 'linear-gradient(135deg, var(--forest), var(--forest-light))', padding: '28px 0 48px' }}>
        <div className="container-sm" style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(127,212,58,0.18)', border: '1px solid rgba(127,212,58,0.35)', borderRadius: 'var(--r-full)', padding: '5px 14px', fontSize: 11, fontWeight: 700, color: 'var(--lime)', marginBottom: 14, letterSpacing: 0.4 }}>
            <Cpu size={12} style={{ animation: 'pulse 2s ease-in-out infinite' }}/> Groq AI will analyse your report
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.8px', marginBottom: 6 }}>
            Report a Problem
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0 }}>
            Your report will be AI-scored for severity and forwarded to the right authorities
          </p>
        </div>
      </div>

      <div className="container-sm" style={{ marginTop: -24, position: 'relative', zIndex: 2 }}>
        <div style={{ background: '#fff', borderRadius: 'var(--r-2xl)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}>
          <div style={{ padding: '28px 28px 0' }}>
            <StepBar step={step}/>
          </div>

          {/* ── Step 1: Category ─────────────────────────────── */}
          <div key={`step-${step}`} style={{ padding: '0 28px 28px', animation: 'fadeInUp 0.3s ease both' }}>
            {step === 1 && (
              <>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--ink)', marginBottom: 6 }}>
                  What type of problem?
                </h2>
                <p style={{ fontSize: 13, color: 'var(--ink-60)', marginBottom: 22 }}>
                  Pick the category that best describes the issue
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px,1fr))', gap: 10, marginBottom: 24 }}>
                  {categories.map((cat, i) => (
                    <div key={cat.id} style={{ animation: `scaleIn 0.3s ease ${i * 0.05}s both`, opacity: 0 }}>
                      <CatButton cat={cat} selected={String(form.category_id) === String(cat.id)} onClick={() => setForm(f => ({ ...f, category_id: cat.id }))}/>
                    </div>
                  ))}
                </div>
                <Button variant="primary" onClick={next} style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
                  Continue <ChevronRight size={16}/>
                </Button>
              </>
            )}

            {/* ── Step 2: Details ──────────────────────────────── */}
            {step === 2 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  {selCat && (
                    <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: selCat.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {CAT_EMOJI[selCat.name] || '📋'}
                    </div>
                  )}
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--ink)', marginBottom: 2 }}>
                      Describe the problem
                    </h2>
                    <span style={{ fontSize: 12, color: selCat?.color || 'var(--ink-60)', fontWeight: 600 }}>{selCat?.name}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label className="input-label">Problem Title *</label>
                    <input name="title" value={form.title} onChange={onChange} style={inputSt}
                      placeholder="e.g. No drinking water for 3 days in Rampur village"
                      maxLength={255} onFocus={handleFocus} onBlur={handleBlur}/>
                    <div className="input-hint" style={{ textAlign: 'right' }}>{form.title.length}/255</div>
                  </div>

                  <div>
                    <label className="input-label">Detailed Description *</label>
                    <textarea name="description" value={form.description} onChange={onChange}
                      style={{ ...inputSt, minHeight: 130, resize: 'vertical' }}
                      placeholder="When did it start? How many people affected? What have you tried? Include as much detail as possible…"
                      maxLength={3000} onFocus={handleFocus} onBlur={handleBlur}/>
                    <div className="input-hint" style={{ textAlign: 'right' }}>{form.description.length}/3000</div>
                  </div>

                  <div>
                    <label className="input-label">Estimated cost to fix (₹, optional)</label>
                    <input name="budget_estimate" value={form.budget_estimate} onChange={onChange}
                      type="number" style={inputSt} placeholder="e.g. 50000"
                      onFocus={handleFocus} onBlur={handleBlur}/>
                    <div className="input-hint">This helps prioritise budget allocation. Leave blank if unknown.</div>
                  </div>

                  <div>
                    <label className="input-label">Photos (up to 5) — strongly recommended</label>
                    <PhotoZone photos={photos} previews={previews} onDrop={onDrop} onRemove={removePhoto}/>
                  </div>

                  {/* Anonymous toggle */}
                  <button type="button" onClick={() => setForm(f => ({ ...f, anonymous: !f.anonymous }))}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', background: form.anonymous ? 'var(--forest)' : 'var(--surface)', border: `1.5px solid ${form.anonymous ? 'var(--forest)' : 'var(--border-dark)'}`, borderRadius: 'var(--r-md)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.25s ease' }}>
                    <Shield size={16} color={form.anonymous ? 'var(--lime)' : 'var(--ink-40)'}/>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: form.anonymous ? '#fff' : 'var(--ink)' }}>
                        {form.anonymous ? '🔒 Anonymous mode ON' : 'Submit anonymously'}
                      </div>
                      <div style={{ fontSize: 11, color: form.anonymous ? 'rgba(255,255,255,0.7)' : 'var(--ink-60)' }}>
                        Your name won't appear on this report
                      </div>
                    </div>
                    <div style={{ width: 40, height: 22, borderRadius: 11, background: form.anonymous ? 'var(--lime)' : 'var(--border-dark)', position: 'relative', transition: 'background 0.25s', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', top: 3, left: form.anonymous ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.25s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}/>
                    </div>
                  </button>

                  {form.description.length >= 20 && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--purple-bg)', border: '1px solid #DDD6FE', borderRadius: 'var(--r-md)', padding: '10px 14px', animation: 'fadeIn 0.3s ease both' }}>
                      <Sparkles size={14} color="var(--purple)" style={{ flexShrink: 0, animation: 'pulse 2s ease-in-out infinite' }}/>
                      <span style={{ fontSize: 12, color: 'var(--purple)', fontWeight: 500 }}>
                        Groq AI will score severity (1–10), write an official summary, extract tags, and suggest the responsible department
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                  <Button variant="ghost" onClick={back}>← Back</Button>
                  <Button variant="primary" onClick={next} style={{ flex: 1, justifyContent: 'center' }}>
                    Continue <ChevronRight size={16}/>
                  </Button>
                </div>
              </>
            )}

            {/* ── Step 3: Location ─────────────────────────────── */}
            {step === 3 && (
              <>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--ink)', marginBottom: 6 }}>
                  Where is this happening?
                </h2>
                <p style={{ fontSize: 13, color: 'var(--ink-60)', marginBottom: 22 }}>
                  Precise location helps officials respond faster
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">State *</label>
                    <select name="state" value={form.state} onChange={onChange} style={inputSt} onFocus={handleFocus} onBlur={handleBlur}>
                      <option value="">Select state…</option>
                      {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="input-label">District *</label>
                    <input name="district" value={form.district} onChange={onChange} style={inputSt} placeholder="e.g. Varanasi" onFocus={handleFocus} onBlur={handleBlur}/>
                  </div>
                  <div>
                    <label className="input-label">Village / Town *</label>
                    <input name="village" value={form.village} onChange={onChange} style={inputSt} placeholder="e.g. Rampur" onFocus={handleFocus} onBlur={handleBlur}/>
                  </div>
                  <div>
                    <label className="input-label">PIN Code</label>
                    <input name="pincode" value={form.pincode} onChange={onChange} style={inputSt} placeholder="221001" maxLength={6} onFocus={handleFocus} onBlur={handleBlur}/>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <Button variant="ghost" onClick={back}>← Back</Button>
                  <Button variant="primary" onClick={next} style={{ flex: 1, justifyContent: 'center' }}>
                    Review & Submit <ChevronRight size={16}/>
                  </Button>
                </div>
              </>
            )}

            {/* ── Step 4: Review & Submit ───────────────────────── */}
            {step === 4 && (
              <>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--ink)', marginBottom: 20 }}>
                  Review your report
                </h2>

                <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: 20, marginBottom: 20 }}>
                  {selCat && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 'var(--r-full)', background: selCat.color + '18', color: selCat.color, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
                      {CAT_EMOJI[selCat.name]} {selCat.name}
                    </div>
                  )}
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>{form.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--ink-60)', lineHeight: 1.6, marginBottom: 12 }}>{form.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-60)', marginBottom: 12 }}>
                    <MapPin size={13}/> {form.village}, {form.district}, {form.state} {form.pincode}
                  </div>
                  {form.anonymous && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--forest)', fontWeight: 600 }}>
                      <Shield size={13}/> Anonymous submission
                    </div>
                  )}
                  {previews.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                      {previews.map((src, i) => (
                        <img key={i} src={src} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 'var(--r-md)', border: '2px solid var(--sage)' }}/>
                      ))}
                    </div>
                  )}
                </div>

                {/* Groq AI what happens next */}
                <div style={{ background: 'linear-gradient(135deg, var(--purple-bg), #EEF2FF)', borderRadius: 'var(--r-lg)', border: '1px solid #DDD6FE', padding: '16px 18px', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                    <Sparkles size={14} color="var(--purple)"/>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: 0.5 }}>What happens after you submit</span>
                  </div>
                  {[
                    'Groq AI (llama3-8b) scores severity 1–10 in under 2 seconds',
                    'An official summary is generated for government officials',
                    'Tags and responsible department are auto-identified',
                    'Your report appears in the live public feed immediately',
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: i < 3 ? 7 : 0 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--purple)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>{i+1}</div>
                      <span style={{ fontSize: 12, color: 'var(--purple)', lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <Button variant="ghost" onClick={back}>← Back</Button>
                  <Button variant="lime" onClick={submit} loading={submitting} style={{ flex: 1, justifyContent: 'center', padding: '13px' }}>
                    {submitting
                      ? <><Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }}/> Groq is analysing…</>
                      : '🚀 Submit Report'
                    }
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
