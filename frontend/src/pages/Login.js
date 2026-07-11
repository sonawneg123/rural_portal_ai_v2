// src/pages/Login.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui';
import { INDIA_STATES } from '../utils/helpers';
import { getError } from '../utils/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Leaf, LogIn, UserPlus, Shield, Sparkles } from 'lucide-react';

/* ── Shared animated input ──────────────────────────────────── */
function AnimInput({ label, name, type = 'text', value, onChange, placeholder, required = true, delay = 0, hint }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ opacity: 0, animation: `fadeInUp 0.4s ease ${delay}s both` }}>
      <label className="input-label">{label}{required ? ' *' : ''}</label>
      {hint && <div className="input-hint" style={{ marginBottom: 5 }}>{hint}</div>}
      <input name={name} type={type} value={value} onChange={onChange}
        placeholder={placeholder} required={required}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        className="input"
        style={{
          borderColor: focus ? 'var(--forest)' : 'var(--border-dark)',
          boxShadow: focus ? '0 0 0 3px rgba(10,61,31,0.1)' : 'none',
        }}/>
    </div>
  );
}

/* ── Side illustration ──────────────────────────────────────── */
function AuthSide() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--forest) 0%, var(--forest-light) 60%, var(--forest-mid) 100%)',
      padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Blobs */}
      {[[180, '-40px', '-40px', 0.1], [120, '40%', '-30px', 0.07], [100, '-30px', '40%', 0.08]].map(([s,t,r,o], i) => (
        <div key={i} style={{ position: 'absolute', width: s, height: s, top: t, right: r, borderRadius: '60% 40% 55% 45%/55% 45% 60% 40%', background: 'var(--lime)', opacity: o, animation: `blobDrift ${8+i*2}s ease-in-out infinite` }}/>
      ))}

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(127,212,58,0.2)', border: '1px solid rgba(127,212,58,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Leaf size={20} color="var(--lime)"/>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#fff' }}>
            ग्रामीण पोर्टल
          </div>
        </div>

        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.8px', marginBottom: 16 }}>
          Make your village's voice heard
        </div>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.65, marginBottom: 32 }}>
          Report problems, track work progress, and hold authorities accountable — all powered by Groq AI.
        </p>

        {[
          { icon: <Sparkles size={14}/>, text: 'Groq AI scores every problem severity' },
          { icon: <Shield size={14}/>,    text: 'Anonymous whistleblower mode' },
          { icon: <Leaf size={14}/>,      text: '10,000+ citizens already joined' },
        ].map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(127,212,58,0.15)', border: '1px solid rgba(127,212,58,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--lime)', flexShrink: 0 }}>
              {f.icon}
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{f.text}</span>
          </div>
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
        © 2026 ग्रामीण पोर्टल · Rural Problems Portal
      </div>
    </div>
  );
}

/* ── LOGIN ───────────────────────────────────────────────────── */
export default function Login() {
  const { login }    = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [show, setShow]       = useState(false);
  const [loading, setLoading] = useState(false);
  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}! 🌿`);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      toast.error(getError(err));
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      <div className="hide-mobile"><AuthSide/></div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: 'var(--cream)' }}>
        <div style={{ width: '100%', maxWidth: 400, animation: 'fadeInUp 0.4s ease both' }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.8px', marginBottom: 6 }}>
              Welcome back
            </h1>
            <p style={{ fontSize: 14, color: 'var(--ink-60)' }}>
              Sign in to report and track problems · <Link to="/register" style={{ color: 'var(--forest)', fontWeight: 600 }}>Create account</Link>
            </p>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <AnimInput label="Email address" name="email" type="email" value={form.email} onChange={onChange} placeholder="you@example.com" delay={0.05}/>

            {/* Password with toggle */}
            <div style={{ opacity: 0, animation: 'fadeInUp 0.4s ease 0.12s both' }}>
              <label className="input-label">Password *</label>
              <div style={{ position: 'relative' }}>
                <input name="password" type={show ? 'text' : 'password'} value={form.password}
                  onChange={onChange} placeholder="Your password" required
                  className="input" style={{ paddingRight: 44 }}/>
                <button type="button" onClick={() => setShow(!show)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-40)', display: 'flex', alignItems: 'center', transition: 'color var(--t-fast)' }}
                  onMouseEnter={e => e.currentTarget.style.color='var(--forest)'}
                  onMouseLeave={e => e.currentTarget.style.color='var(--ink-40)'}>
                  {show ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            <div style={{ opacity: 0, animation: 'fadeInUp 0.4s ease 0.18s both' }}>
              <Button type="submit" variant="primary" loading={loading} style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
                <LogIn size={16}/> Sign In
              </Button>
            </div>
          </form>

          <div style={{ marginTop: 20, padding: '14px 16px', background: '#fff', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--ink-60)', animation: 'fadeIn 0.4s ease 0.3s both', opacity: 0 }}>
            <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: 2 }}>Demo Admin</strong>
            admin@ruralportal.in · Admin@1234
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── REGISTER ─────────────────────────────────────────────────── */
export function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', state:'', district:'', village:'', anonymous_mode: false });
  const [loading, setLoading] = useState(false);
  const onChange = e => setForm({ ...form, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const [focusState, setFocusState] = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password needs at least 8 characters'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Welcome to ग्रामीण पोर्टल! 🌿');
      navigate('/');
    } catch (err) {
      toast.error(getError(err));
    } finally { setLoading(false); }
  };

  const fields = [
    { label:'Full Name',        name:'name',     type:'text',     placeholder:'Ravi Kumar',      delay:0.05 },
    { label:'Email',            name:'email',    type:'email',    placeholder:'ravi@example.com',delay:0.10 },
    { label:'Password (min 8)', name:'password', type:'password', placeholder:'Min 8 characters',delay:0.15 },
    { label:'Phone (optional)', name:'phone',    type:'tel',      placeholder:'+91 9876543210',  delay:0.20, required:false },
    { label:'Village / Town',   name:'village',  type:'text',     placeholder:'Rampur',          delay:0.25 },
    { label:'District',         name:'district', type:'text',     placeholder:'Varanasi',        delay:0.30 },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      <div className="hide-mobile"><AuthSide/></div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: 'var(--cream)', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 420, animation: 'fadeInUp 0.4s ease both' }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.8px', marginBottom: 6 }}>
              Create your account
            </h1>
            <p style={{ fontSize: 14, color: 'var(--ink-60)' }}>
              Join 10,000+ citizens · <Link to="/login" style={{ color: 'var(--forest)', fontWeight: 600 }}>Sign in instead</Link>
            </p>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {fields.map(f => (
              <AnimInput key={f.name} {...f} value={form[f.name]} onChange={onChange}/>
            ))}

            {/* State select */}
            <div style={{ opacity: 0, animation: 'fadeInUp 0.4s ease 0.35s both' }}>
              <label className="input-label">State *</label>
              <select name="state" value={form.state} onChange={onChange} required
                onFocus={() => setFocusState(true)} onBlur={() => setFocusState(false)}
                className="input"
                style={{ borderColor: focusState ? 'var(--forest)' : 'var(--border-dark)', boxShadow: focusState ? '0 0 0 3px rgba(10,61,31,0.1)' : 'none' }}>
                <option value="">Select your state…</option>
                {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Anonymous mode toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#fff', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', cursor: 'pointer', opacity: 0, animation: 'fadeInUp 0.4s ease 0.4s both' }}
              onClick={() => setForm(f => ({ ...f, anonymous_mode: !f.anonymous_mode }))}>
              <Shield size={16} color={form.anonymous_mode ? 'var(--forest)' : 'var(--ink-40)'}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Anonymous Whistleblower Mode</div>
                <div style={{ fontSize: 11, color: 'var(--ink-60)' }}>Your name will not appear on reports — only your state/district</div>
              </div>
              <div style={{ width: 36, height: 20, borderRadius: 10, background: form.anonymous_mode ? 'var(--forest)' : 'var(--border-dark)', position: 'relative', transition: 'background var(--t-base)', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 2, left: form.anonymous_mode ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left var(--t-spring)', boxShadow: 'var(--shadow-sm)' }}/>
              </div>
            </div>

            <div style={{ opacity: 0, animation: 'fadeInUp 0.4s ease 0.45s both' }}>
              <Button type="submit" variant="primary" loading={loading} style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
                <UserPlus size={16}/> Create Account
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
