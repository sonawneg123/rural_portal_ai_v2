import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Leaf, LogIn, Sparkles, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getError } from '../api/client.js';

function AuthSide() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-navy via-navy-light to-navy-mid p-10 lg:p-12 flex flex-col justify-between">
      {[[180, '-40px', '-40px', 0.1], [120, '40%', '-30px', 0.07]].map(([s, t, r, o], i) => (
        <motion.div key={i}
          animate={{ borderRadius: ['60% 40% 55% 45%/55% 45% 60% 40%', '45% 55% 40% 60%/60% 40% 55% 45%'] }}
          transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bg-teal pointer-events-none"
          style={{ width: s, height: s, top: t, right: r, opacity: o }} />
      ))}

      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-10 h-10 rounded-xl bg-teal/20 border border-teal/30 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-teal" />
          </div>
          <div className="font-display font-bold text-lg text-white">ग्रामीण पोर्टल</div>
        </div>

        <h1 className="font-display text-[28px] font-extrabold text-white leading-tight tracking-tight mb-4">
          Make your village's voice heard
        </h1>
        <p className="text-sm text-white/70 leading-relaxed mb-8">
          Report problems, track work progress, and hold authorities accountable — powered by Groq AI.
        </p>

        {[
          { icon: Sparkles, text: 'Groq AI scores every problem severity' },
          { icon: Shield,   text: 'Anonymous whistleblower mode' },
          { icon: Leaf,     text: '10,000+ citizens already joined' },
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-lg bg-teal/15 border border-teal/25 flex items-center justify-center text-teal flex-shrink-0">
              <f.icon className="w-3.5 h-3.5" />
            </div>
            <span className="text-[13px] text-white/80">{f.text}</span>
          </div>
        ))}
      </div>
      <div className="relative z-10 text-xs text-white/40">© 2026 ग्रामीण पोर्टल · Rural Governance Portal</div>
    </div>
  );
}

export default function Login() {
  const { login }  = useAuth();
  const navigate    = useNavigate();
  const location    = useLocation();
  const [show, setShow]       = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      const user = await login(formData.email, formData.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}! 🌿`);
      const from = location.state?.from?.pathname;
      navigate(from || (user.role !== 'user' ? '/' : '/'));
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] grid lg:grid-cols-2">
      <div className="hidden lg:block"><AuthSide /></div>

      <div className="flex items-center justify-center p-6 lg:p-10 bg-slate-50 dark:bg-slate-900">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="font-display text-[28px] font-extrabold text-ink dark:text-slate-100 tracking-tight mb-1.5">Welcome back</h1>
            <p className="text-sm text-slate-500">
              Sign in to report and track problems · <Link to="/register" className="text-navy dark:text-teal font-semibold no-underline">Create account</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="input-label">Email address</label>
              <input type="email" placeholder="you@example.com"
                className={`input ${errors.email ? 'input-error' : ''}`}
                {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} placeholder="Your password"
                  className={`input pr-11 ${errors.password ? 'input-error' : ''}`}
                  {...register('password', { required: 'Password is required' })} />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy transition-colors">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn btn-navy w-full justify-center py-3">
              {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <LogIn className="w-4 h-4" />}
              Sign In
            </button>
          </form>

          <div className="mt-5 p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
            <strong className="block text-ink dark:text-slate-200 mb-0.5">Demo Admin</strong>
            admin@ruralportal.in · Admin@1234
          </div>
        </motion.div>
      </div>
    </div>
  );
}
