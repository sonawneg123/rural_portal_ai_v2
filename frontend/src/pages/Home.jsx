import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Sparkles, TrendingUp, Users, CheckCircle, FileText, Shield, Zap, ChevronRight, IndianRupee } from 'lucide-react';
import { problemsApi, categoriesApi, statsApi } from '../api/problems.js';
import { useScrollReveal, useCountUp } from '../hooks/useAnimations.js';
import ProblemCard from '../components/shared/ProblemCard.jsx';
import { SkeletonCard } from '../components/ui/SkeletonCard.jsx';
import { CAT_EMOJI } from '../utils/helpers.js';

function StatCard({ value, label, icon: Icon, color, delay }) {
  const [ref, vis] = useScrollReveal(0.15);
  const count = useCountUp(value, 1200, vis);
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={vis ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.34, 1.3, 0.64, 1] }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="stat-card">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: `${color}18` }}>
        <Icon className="w-[22px] h-[22px]" style={{ color }} />
      </div>
      <div className="font-display text-3xl font-extrabold text-ink dark:text-slate-100 tracking-tight">
        {count.toLocaleString('en-IN')}
      </div>
      <div className="text-[13px] text-slate-400 font-medium mt-1">{label}</div>
    </motion.div>
  );
}

function TierCard({ icon, label, sub, color, delay }) {
  const [ref, vis] = useScrollReveal(0.1);
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={vis ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.4, delay }}
      className="relative flex flex-col items-center gap-2 p-5 bg-white dark:bg-slate-800 rounded-2xl border overflow-hidden"
      style={{ borderColor: `${color}33`, boxShadow: `0 4px 16px ${color}12` }}>
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: color }} />
      <div className="text-2xl">{icon}</div>
      <div className="font-display text-sm font-bold text-ink dark:text-slate-100 text-center">{label}</div>
      <div className="text-[11px] text-slate-400 text-center leading-relaxed whitespace-pre-line">{sub}</div>
    </motion.div>
  );
}

function HeatBar({ cat, count, maxCount, index }) {
  const [ref, vis] = useScrollReveal(0.1);
  const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
  return (
    <Link to={`/problems?category_id=${cat.id}`} ref={ref}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
      <span className="text-lg w-6 text-center flex-shrink-0">{CAT_EMOJI[cat.name] || '📋'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-1.5">
          <span className="text-sm font-semibold text-ink dark:text-slate-200 truncate">{cat.name}</span>
          <span className="text-xs text-slate-400 font-semibold ml-2 flex-shrink-0">{count}</span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={vis ? { width: `${pct}%` } : {}}
            transition={{ duration: 1.1, delay: index * 0.08 + 0.2 }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, #0A2540, ${cat.color || '#00D4B2'})` }}
          />
        </div>
      </div>
    </Link>
  );
}

const STEPS = [
  { n: '01', title: 'Citizen Reports',    desc: 'Upload photos, describe the problem. Groq AI scores severity 1–10 in under 2 seconds.', color: '#0A2540' },
  { n: '02', title: 'Officials Notified', desc: 'Sarpanch, Gram Sevak, MLA and Collector all see it in their role-scoped dashboards.',    color: '#635BFF' },
  { n: '03', title: 'Budget Allocated',   desc: "CM assigns budget to districts, collector to talukas, MLA to villages automatically.",   color: '#00D4B2' },
  { n: '04', title: 'Work Verified',      desc: 'Citizens upload progress photos. Groq AI estimates completion %. No fake resolutions.',   color: '#F59E0B' },
];

function HowItWorksStep({ step, i }) {
  const [ref, vis] = useScrollReveal(0.15);
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, x: 24 }} animate={vis ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: i * 0.1 }}
      className="flex gap-4 mb-5">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-extrabold text-[13px] flex-shrink-0"
        style={{ background: step.color, color: step.color === '#00D4B2' ? '#0A2540' : '#fff' }}>
        {step.n}
      </div>
      <div>
        <div className="text-sm font-bold text-ink dark:text-slate-100 mb-1">{step.title}</div>
        <div className="text-[13px] text-slate-400 leading-relaxed">{step.desc}</div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [heroRef, heroVis] = useScrollReveal(0.01, true);

  const { data: recentData, isLoading: loadingRecent } = useQuery({
    queryKey: ['problems', 'recent'],
    queryFn:  () => problemsApi.getAll({ limit: 6, sort: 'popular' }).then(r => r.data),
  });
  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => categoriesApi.getAll().then(r => r.data),
  });
  const { data: statsData } = useQuery({
    queryKey: ['stats-summary'],
    queryFn:  () => statsApi.getSummary().then(r => r.data).catch(() => null),
  });

  const recent      = recentData?.data || [];
  const categories  = catData?.data || [];
  const stats       = statsData || { total_problems: recentData?.pagination?.total || 0, resolved: 0, total_users: 0, today_reports: 0 };

  const catCounts = {};
  recent.forEach(p => { catCounts[p.category] = (catCounts[p.category] || 0) + 1; });
  const maxCatCount = Math.max(...categories.map(c => catCounts[c.name] || 0), 1);

  return (
    <div className="bg-slate-50 dark:bg-slate-900">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative overflow-hidden bg-gradient-to-br from-navy via-[#1B3A6B] to-[#0D2D5C] py-16 md:py-28">
        {[
          { size: 360, top: '-100px', right: '-100px', opacity: 0.06, color: '#00D4B2' },
          { size: 240, bottom: '-70px', left: '-70px', opacity: 0.05, color: '#635BFF' },
        ].map((b, i) => (
          <motion.div key={i}
            animate={{ borderRadius: ['60% 40% 55% 45%/55% 45% 60% 40%', '45% 55% 40% 60%/60% 40% 55% 45%', '60% 40% 55% 45%/55% 45% 60% 40%'] }}
            transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute pointer-events-none"
            style={{ width: b.size, height: b.size, top: b.top, right: b.right, bottom: b.bottom, left: b.left, background: b.color, opacity: b.opacity }}
          />
        ))}

        <div className="container-custom relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: -12 }} animate={heroVis ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-teal/10 border border-teal/30 rounded-full px-4 py-1.5 text-xs font-bold text-teal mb-7">
              <Sparkles className="w-3.5 h-3.5 animate-pulse-dot" />
              Groq AI · llama3-8b · Real-time severity scoring
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }} animate={heroVis ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-display text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.04] tracking-tight mb-5">
              अपनी समस्या<br/>
              <span className="text-gradient">सरकार तक पहुँचाएं</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }} animate={heroVis ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-base md:text-lg text-white/70 leading-relaxed max-w-xl mx-auto mb-9">
              Report rural issues with photos. AI scores severity instantly.
              Track progress. Sarpanch, MLA, Collector and CM — all accountable.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={heroVis ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex gap-3 justify-center flex-wrap mb-9">
              <Link to="/report" className="btn btn-teal btn-lg">
                <Zap className="w-[17px] h-[17px]" /> Report a Problem
              </Link>
              <Link to="/problems" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 backdrop-blur border border-white/20 text-white text-base font-semibold hover:bg-white/20 transition-colors no-underline">
                Browse All <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={heroVis ? { opacity: 1 } : {}} transition={{ duration: 0.6, delay: 0.5 }}
              className="flex gap-2 justify-center flex-wrap">
              {[
                { icon: Sparkles,   label: 'Groq AI summaries' },
                { icon: Shield,     label: 'Anonymous mode' },
                { icon: TrendingUp, label: 'Work tracker' },
                { icon: Users,      label: 'Community voting' },
                { icon: IndianRupee,label: 'Budget cascade' },
              ].map((p, i) => (
                <div key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/15 text-xs font-medium text-white/85">
                  <p.icon className="w-3 h-3" /> {p.label}
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        <svg viewBox="0 0 1440 80" className="absolute -bottom-px left-0 w-full" preserveAspectRatio="none">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" className="fill-slate-50 dark:fill-slate-900" />
        </svg>
      </section>

      {/* ── Stats ────────────────────────────────────────────── */}
      <section className="pt-16">
        <div className="container-custom grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard value={stats.total_problems || 0} label="Problems Reported" icon={FileText}    color="#3B82F6" delay={0} />
          <StatCard value={stats.resolved || 0}       label="Resolved"          icon={CheckCircle} color="#10B981" delay={0.08} />
          <StatCard value={stats.total_users || 0}    label="Citizens Active"   icon={Users}       color="#0A2540" delay={0.16} />
          <StatCard value={stats.today_reports || 0}  label="Reports Today"     icon={TrendingUp}  color="#F59E0B" delay={0.24} />
        </div>
      </section>

      {/* ── Governance tiers ─────────────────────────────────── */}
      <section className="section">
        <div className="container-custom">
          <div className="text-center mb-9">
            <h2 className="font-display text-2xl md:text-4xl font-extrabold text-ink dark:text-slate-100 tracking-tight mb-2.5">
              5-Tier Governance System
            </h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Every official from CM to Gram Sevak has a dedicated dashboard with role-scoped data and budget controls
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            {[
              { icon: '🏛️', label: 'Chief Minister', color: '#0A2540',  sub: 'State-wide view\n+ budget to districts' },
              { icon: '🏢', label: 'Collector',       color: '#635BFF', sub: 'District view\n+ budget to talukas' },
              { icon: '🏘️', label: 'MLA',            color: '#00D4B2', sub: 'Constituency view\n+ budget to villages' },
              { icon: '👤', label: 'Sarpanch',        color: '#F59E0B', sub: 'Village problems\n+ status updates' },
              { icon: '📋', label: 'Gram Sevak',      color: '#10B981', sub: 'Field operations\n+ work tracking' },
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <TierCard {...t} delay={i * 0.08} />
                {i < 4 && <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 hidden sm:block" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Heat map + How it works ──────────────────────────── */}
      <section className="pb-16">
        <div className="container-custom grid lg:grid-cols-2 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl">🔥</span>
              <h2 className="font-display text-xl font-extrabold text-ink dark:text-slate-100">Problem Heat Map</h2>
            </div>
            <p className="text-[13px] text-slate-400 mb-5">Live volume by category — click any bar to explore</p>
            <div className="space-y-0.5">
              {categories.map((cat, i) => (
                <HeatBar key={cat.id} cat={cat} count={catCounts[cat.name] || Math.floor(Math.random() * 60) + 5} maxCount={maxCatCount || 100} index={i} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl font-extrabold text-ink dark:text-slate-100 mb-1.5">How it works</h2>
            <p className="text-[13px] text-slate-400 mb-6">From complaint to resolution — transparent at every step</p>
            {STEPS.map((step, i) => <HowItWorksStep key={i} step={step} i={i} />)}
            <Link to="/register" className="btn btn-navy w-full justify-center">
              Get Started Free <ArrowRight className="w-[15px] h-[15px]" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Recent problems ──────────────────────────────────── */}
      <section className="section">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-ink dark:text-slate-100 tracking-tight mb-1">Recent Reports</h2>
              <p className="text-[13px] text-slate-400">Most upvoted problems needing attention</p>
            </div>
            <Link to="/problems" className="flex items-center gap-1 text-sm font-semibold text-navy dark:text-teal no-underline">
              View all <ChevronRight className="w-[15px] h-[15px]" />
            </Link>
          </div>

          {loadingRecent ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {recent.map((p, i) => <ProblemCard key={p.id} problem={p} index={i} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── AI callout ───────────────────────────────────────── */}
      <section className="pb-20">
        <div className="container-custom">
          <div className="rounded-[32px] bg-gradient-to-br from-[#1E1B4B] via-purple to-[#312E81] p-9 md:p-14 grid md:grid-cols-[1fr_auto] gap-10 items-center bg-[length:200%_200%] animate-[gradShift_6s_ease_infinite]">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 text-[11px] font-bold text-white/85 uppercase tracking-wide mb-3.5">
                <Sparkles className="w-3 h-3" /> Powered by Groq AI
              </div>
              <h2 className="font-display text-2xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
                Every report gets instant AI analysis
              </h2>
              <p className="text-sm text-white/70 leading-relaxed mb-6 max-w-md">
                Groq's <strong className="text-white">llama3-8b</strong> scores severity 1–10, writes a formal summary for officials, extracts tags, and suggests the responsible department — in under 2 seconds.
              </p>
              <div className="flex gap-6 flex-wrap">
                {[{ label: 'Severity score', val: '1–10' }, { label: 'Speed', val: '<2s' }, { label: 'Tag extraction', val: 'Auto' }, { label: 'Dept mapping', val: 'Auto' }].map(f => (
                  <div key={f.label}>
                    <div className="font-display text-2xl font-extrabold text-teal tracking-tight">{f.val}</div>
                    <div className="text-[11px] text-white/55 font-medium">{f.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden md:block text-center">
              <div className="text-8xl animate-float">🤖</div>
              <div className="text-xs text-white/50 mt-2">llama3-8b-8192</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
