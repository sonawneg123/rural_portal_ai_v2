import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { UserPlus, Shield, Leaf, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getError } from '../api/client.js';
import { INDIA_STATES } from '../utils/helpers.js';

function AuthSide() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-navy via-navy-light to-navy-mid p-10 lg:p-12 flex flex-col justify-between">
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-10 h-10 rounded-xl bg-teal/20 border border-teal/30 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-teal" />
          </div>
          <div className="font-display font-bold text-lg text-white">ग्रामीण पोर्टल</div>
        </div>
        <h1 className="font-display text-[28px] font-extrabold text-white leading-tight tracking-tight mb-4">
          Join 10,000+ citizens
        </h1>
        <p className="text-sm text-white/70 leading-relaxed mb-8">
          Create an account to report problems and track official responses in your village.
        </p>
        {[
          { icon: Sparkles, text: 'AI-powered severity scoring' },
          { icon: Shield,   text: 'Optional anonymous mode' },
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-lg bg-teal/15 border border-teal/25 flex items-center justify-center text-teal flex-shrink-0">
              <f.icon className="w-3.5 h-3.5" />
            </div>
            <span className="text-[13px] text-white/80">{f.text}</span>
          </div>
        ))}
      </div>
      <div className="relative z-10 text-xs text-white/40">© 2026 ग्रामीण पोर्टल</div>
    </div>
  );
}

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      await registerUser({ ...formData, anonymous_mode: anonymous });
      toast.success('Welcome to ग्रामीण पोर्टल! 🌿');
      navigate('/');
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: 'Full Name',        name: 'name',     type: 'text',  placeholder: 'Ravi Kumar' },
    { label: 'Email',            name: 'email',    type: 'email', placeholder: 'ravi@example.com' },
    { label: 'Password (min 8)', name: 'password', type: 'password', placeholder: 'Min 8 characters' },
    { label: 'Phone (optional)', name: 'phone',    type: 'tel',   placeholder: '+91 9876543210', required: false },
    { label: 'Village / Town',   name: 'village',  type: 'text',  placeholder: 'Rampur' },
    { label: 'District',         name: 'district', type: 'text',  placeholder: 'Varanasi' },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] grid lg:grid-cols-2">
      <div className="hidden lg:block"><AuthSide /></div>

      <div className="flex items-center justify-center p-6 lg:p-10 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="w-full max-w-md py-8">
          <div className="mb-6">
            <h1 className="font-display text-[28px] font-extrabold text-ink dark:text-slate-100 tracking-tight mb-1.5">Create your account</h1>
            <p className="text-sm text-slate-500">
              Already have one? <Link to="/login" className="text-navy dark:text-teal font-semibold no-underline">Sign in instead</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            {fields.map(f => (
              <div key={f.name}>
                <label className="input-label">{f.label}{f.required !== false ? ' *' : ''}</label>
                <input type={f.type} placeholder={f.placeholder}
                  className={`input ${errors[f.name] ? 'input-error' : ''}`}
                  {...register(f.name, f.required !== false ? { required: `${f.label} is required` } : {})} />
                {errors[f.name] && <p className="text-xs text-red-500 mt-1">{errors[f.name].message}</p>}
              </div>
            ))}

            <div>
              <label className="input-label">State *</label>
              <select className="input" {...register('state', { required: true })}>
                <option value="">Select your state…</option>
                {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Anonymous toggle */}
            <div onClick={() => setAnonymous(a => !a)}
              className="flex items-center gap-3 p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
              <Shield className={`w-4 h-4 ${anonymous ? 'text-navy' : 'text-slate-300'}`} />
              <div className="flex-1">
                <div className="text-sm font-semibold text-ink dark:text-slate-200">Anonymous Whistleblower Mode</div>
                <div className="text-xs text-slate-400">Your name won't appear on reports — only your state/district</div>
              </div>
              <div className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${anonymous ? 'bg-navy' : 'bg-slate-300'}`}>
                <motion.div layout className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow" animate={{ left: anonymous ? 18 : 2 }} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-navy w-full justify-center py-3">
              {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Create Account
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
