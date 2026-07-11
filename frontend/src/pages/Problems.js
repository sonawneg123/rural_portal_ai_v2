// src/pages/Problems.js
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, X, TrendingUp, Flame } from 'lucide-react';
import api from '../utils/api';
import { useScrollReveal } from '../hooks/useAnimations';
import ProblemCard from '../components/shared/ProblemCard';
import { SkeletonCard, EmptyState, Button } from '../components/ui';
import { INDIA_STATES, STATUS_CONFIG, CAT_EMOJI } from '../utils/helpers';

/* ── Filter chip ─────────────────────────────────────────────── */
function FilterChip({ label, onRemove }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 'var(--r-full)',
      background: 'var(--sage-light)', color: 'var(--forest)',
      fontSize: 12, fontWeight: 600,
      animation: 'scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
    }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--forest)', display: 'flex', alignItems: 'center', padding: 0, opacity: 0.7 }}>
        <X size={12}/>
      </button>
    </span>
  );
}

/* ── Sidebar filter section ─────────────────────────────────── */
function FilterSection({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: 20 }}>
      <button onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 8px', borderBottom: '1px solid var(--border)', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-60)', textTransform: 'uppercase', letterSpacing: 0.6 }}>{title}</span>
        <ChevronRight size={13} color="var(--ink-40)" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform var(--t-fast)' }}/>
      </button>
      {open && children}
    </div>
  );
}

export default function Problems() {
  const [sp, setSp]           = useSearchParams();
  const [problems,   setProblems]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading,    setLoading]    = useState(true);
  const [searchVal,  setSearchVal]  = useState(sp.get('search') || '');
  const [sideOpen,   setSideOpen]   = useState(false);
  const [headerRef,  headerVis]     = useScrollReveal(0.05);

  const g = k => sp.get(k) || '';
  const set = (k, v) => {
    const p = new URLSearchParams(sp);
    if (v) p.set(k, v); else p.delete(k);
    if (k !== 'page') p.set('page', '1');
    setSp(p);
  };
  const clearAll = () => setSp({});

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/problems', {
        params: {
          state: g('state'), district: g('district'),
          category_id: g('category_id'), status: g('status'),
          search: g('search'), sort: g('sort') || 'newest',
          page: g('page') || '1', limit: 12,
        },
      });
      setProblems(data.data || []);
      setPagination(data.pagination || {});
    } catch { /* silent */ }
    finally { setLoading(false); }
  // eslint-disable-next-line
  }, [sp]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { api.get('/categories').then(r => setCategories(r.data.data || [])); }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => set('search', searchVal), 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line
  }, [searchVal]);

  const page         = parseInt(g('page') || '1');
  const activeCount  = ['state','category_id','status'].filter(k => g(k)).length;

  const Sidebar = () => (
    <div style={{ width: 224, flexShrink: 0 }}>
      <div style={{
        background: '#fff', borderRadius: 'var(--r-xl)',
        border: '1px solid var(--border)', padding: '18px',
        boxShadow: 'var(--shadow-sm)', position: 'sticky', top: 84,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
            <SlidersHorizontal size={15}/> Filters
          </span>
          {activeCount > 0 && (
            <button onClick={clearAll} style={{ fontSize: 11, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Clear ({activeCount})
            </button>
          )}
        </div>

        <FilterSection title="State">
          <select value={g('state')} onChange={e => set('state', e.target.value)}
            className="input" style={{ fontSize: 13, padding: '8px 10px' }}>
            <option value="">All states</option>
            {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </FilterSection>

        <FilterSection title="Category">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {categories.map(cat => {
              const active = g('category_id') === String(cat.id);
              return (
                <button key={cat.id} onClick={() => set('category_id', active ? '' : String(cat.id))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                    borderRadius: 'var(--r-md)', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                    background: active ? 'var(--sage-light)' : 'transparent',
                    color: active ? 'var(--forest)' : 'var(--ink-60)',
                    fontWeight: active ? 700 : 400, fontSize: 13,
                    transition: 'all var(--t-fast)',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                  <span style={{ fontSize: 15 }}>{CAT_EMOJI[cat.name] || '📋'}</span>
                  {cat.name}
                </button>
              );
            })}
          </div>
        </FilterSection>

        <FilterSection title="Status">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const active = g('status') === key;
              return (
                <button key={key} onClick={() => set('status', active ? '' : key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                    borderRadius: 'var(--r-md)', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                    background: active ? cfg.bg : 'transparent',
                    transition: 'all var(--t-fast)',
                  }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, boxShadow: active ? `0 0 0 3px ${cfg.color}33` : 'none' }}/>
                  <span style={{ fontSize: 13, fontWeight: active ? 700 : 400, color: active ? cfg.color : 'var(--ink-60)' }}>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </FilterSection>

        <FilterSection title="Sort by">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[
              { val: 'newest',  label: 'Newest first' },
              { val: 'popular', label: 'Most upvoted' },
              { val: 'severity',label: 'Highest severity' },
              { val: 'views',   label: 'Most viewed' },
              { val: 'oldest',  label: 'Oldest first' },
            ].map(opt => {
              const active = (g('sort') || 'newest') === opt.val;
              return (
                <button key={opt.val} onClick={() => set('sort', opt.val)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                    borderRadius: 'var(--r-md)', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
                    background: active ? 'var(--sage-light)' : 'transparent',
                    color: active ? 'var(--forest)' : 'var(--ink-60)',
                    fontWeight: active ? 700 : 400, fontSize: 13,
                    transition: 'all var(--t-fast)',
                  }}>
                  {active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--forest)' }}/>}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </FilterSection>
      </div>
    </div>
  );

  return (
    <div className="page-enter" style={{ background: 'var(--surface)', minHeight: '100vh' }}>
      {/* Page header */}
      <div style={{ background: 'linear-gradient(180deg, var(--forest), var(--forest-light))', padding: '36px 0 48px' }}>
        <div className="container">
          <div ref={headerRef} style={{ opacity: headerVis ? 1 : 0, transform: headerVis ? 'translateY(0)' : 'translateY(-16px)', transition: 'all 0.5s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Flame size={18} color="var(--lime)"/>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 800, color: 'var(--lime)', textTransform: 'uppercase', letterSpacing: 1 }}>
                Live problem feed
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, color: '#fff', letterSpacing: '-1px', marginBottom: 8 }}>
              Browse Problems
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 24 }}>
              {pagination.total || 0} reports from across India
            </p>

            {/* Search bar */}
            <div style={{ position: 'relative', maxWidth: 520 }}>
              <Search size={16} color="var(--ink-40)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}/>
              <input
                value={searchVal} onChange={e => setSearchVal(e.target.value)}
                placeholder="Search problems by title, location, or tag…"
                style={{
                  width: '100%', padding: '12px 40px 12px 42px',
                  borderRadius: 'var(--r-lg)', border: 'none',
                  fontSize: 14, color: 'var(--ink)', outline: 'none',
                  boxShadow: 'var(--shadow-md)', boxSizing: 'border-box',
                }}/>
              {searchVal && (
                <button onClick={() => { setSearchVal(''); set('search', ''); }}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-40)', display: 'flex', alignItems: 'center' }}>
                  <X size={15}/>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28, paddingBottom: 60 }}>
        {/* Active filter chips */}
        {activeCount > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {g('state')       && <FilterChip label={`State: ${g('state')}`}      onRemove={() => set('state', '')}/>}
            {g('category_id') && <FilterChip label={`Cat: ${categories.find(c=>String(c.id)===g('category_id'))?.name||'…'}`} onRemove={() => set('category_id', '')}/>}
            {g('status')      && <FilterChip label={`${STATUS_CONFIG[g('status')]?.label}`} onRemove={() => set('status', '')}/>}
            <button onClick={clearAll} style={{ fontSize: 12, color: 'var(--ink-60)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
              Clear all
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          {/* Desktop sidebar */}
          <div className="hide-mobile">
            <Sidebar/>
          </div>

          {/* Main grid */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <div className="grid-auto">
                {[...Array(6)].map((_,i) => (
                  <div key={i} style={{ animation: `fadeInUp 0.35s ease ${i*0.07}s both`, opacity: 0 }}>
                    <SkeletonCard/>
                  </div>
                ))}
              </div>
            ) : problems.length ? (
              <>
                <div className="grid-auto">
                  {problems.map((p, i) => <ProblemCard key={p.id} problem={p} index={i}/>)}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 36, animation: 'fadeIn 0.4s ease both' }}>
                    <button disabled={page === 1} onClick={() => set('page', String(page-1))}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)', background: '#fff', cursor: page===1?'not-allowed':'pointer', opacity: page===1?0.4:1, fontSize: 13, fontWeight: 600, color: 'var(--ink)', transition: 'all var(--t-fast)' }}
                      onMouseEnter={e => { if (page!==1) e.currentTarget.style.background='var(--surface)'; }}
                      onMouseLeave={e => e.currentTarget.style.background='#fff'}>
                      <ChevronLeft size={15}/> Prev
                    </button>

                    <div style={{ display: 'flex', gap: 4 }}>
                      {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                        const p2 = i + 1;
                        const active = p2 === page;
                        return (
                          <button key={p2} onClick={() => set('page', String(p2))}
                            style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', border: active ? 'none' : '1.5px solid var(--border)', background: active ? 'var(--forest)' : '#fff', color: active ? '#fff' : 'var(--ink)', fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', transition: 'all var(--t-spring)', transform: active ? 'scale(1.08)' : 'scale(1)' }}>
                            {p2}
                          </button>
                        );
                      })}
                    </div>

                    <button disabled={page === pagination.totalPages} onClick={() => set('page', String(page+1))}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)', background: '#fff', cursor: page===pagination.totalPages?'not-allowed':'pointer', opacity: page===pagination.totalPages?0.4:1, fontSize: 13, fontWeight: 600, color: 'var(--ink)', transition: 'all var(--t-fast)' }}>
                      Next <ChevronRight size={15}/>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState emoji="🔍" title="No problems found"
                description="Try adjusting your filters or search term to find what you're looking for."
                action={
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button variant="outline" size="sm" onClick={clearAll}>Clear filters</Button>
                    <Link to="/report" className="btn btn-primary btn-sm"><TrendingUp size={13}/> Report new problem</Link>
                  </div>
                }/>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
