import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, X, TrendingUp, Flame, ChevronRight } from 'lucide-react';
import { problemsApi, categoriesApi } from '../api/problems.js';
import { useDebounce } from '../hooks/useAnimations.js';
import ProblemCard from '../components/shared/ProblemCard.jsx';
import { SkeletonCard } from '../components/ui/SkeletonCard.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { INDIA_STATES, STATUS_CONFIG, CAT_EMOJI } from '../utils/helpers.js';

function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-5">
      <button onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full pb-2 mb-2.5 border-b border-slate-100 dark:border-slate-700">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{title}</span>
        <ChevronRight className={`w-3.5 h-3.5 text-slate-300 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && children}
    </div>
  );
}

export default function Problems() {
  const [sp, setSp] = useSearchParams();
  const [searchInput, setSearchInput] = useState(sp.get('search') || '');
  const debouncedSearch = useDebounce(searchInput, 400);

  const g = (k) => sp.get(k) || '';
  const set = (k, v) => {
    const p = new URLSearchParams(sp);
    if (v) p.set(k, v); else p.delete(k);
    if (k !== 'page') p.set('page', '1');
    setSp(p);
  };

  // Sync debounced search to URL
  useEffect(() => {
    if (debouncedSearch !== g('search')) set('search', debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const page = parseInt(g('page') || '1');

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => categoriesApi.getAll().then(r => r.data),
  });
  const categories = catData?.data || [];

  const { data, isLoading } = useQuery({
    queryKey: ['problems', sp.toString()],
    queryFn: () => problemsApi.getAll({
      state: g('state'), category_id: g('category_id'), status: g('status'),
      search: g('search'), sort: g('sort') || 'newest', page, limit: 12,
    }).then(r => r.data),
  });

  const problems   = data?.data || [];
  const pagination = data?.pagination || {};
  const activeCount = ['state', 'category_id', 'status'].filter(k => g(k)).length;

  const clearAll = () => setSp({});

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-b from-navy to-navy-light py-9 md:py-12">
        <div className="container-custom">
          <div className="flex items-center gap-2 mb-2.5">
            <Flame className="w-[18px] h-[18px] text-teal" />
            <span className="font-display text-[11px] font-extrabold text-teal uppercase tracking-widest">Live problem feed</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">Browse Problems</h1>
          <p className="text-sm text-white/60 mb-6">{pagination.total || 0} reports from across India</p>

          <div className="relative max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search problems by title, location, or tag…"
              className="w-full pl-10 pr-10 py-3 rounded-2xl border-0 text-sm text-ink outline-none shadow-lg" />
            {searchInput && (
              <button onClick={() => { setSearchInput(''); set('search', ''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container-custom py-7">
        {/* Active filter chips */}
        {activeCount > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {g('state') && (
              <span className="badge bg-teal/15 text-navy flex items-center gap-1">
                State: {g('state')} <button onClick={() => set('state', '')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {g('category_id') && (
              <span className="badge bg-teal/15 text-navy flex items-center gap-1">
                Cat: {categories.find(c => String(c.id) === g('category_id'))?.name || '…'} <button onClick={() => set('category_id', '')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {g('status') && (
              <span className="badge bg-teal/15 text-navy flex items-center gap-1">
                {STATUS_CONFIG[g('status')]?.label} <button onClick={() => set('status', '')}><X className="w-3 h-3" /></button>
              </span>
            )}
            <button onClick={clearAll} className="text-xs text-slate-400 font-medium hover:text-red-500">Clear all</button>
          </div>
        )}

        <div className="flex gap-6 items-start">
          {/* Sidebar */}
          <div className="hidden lg:block w-56 flex-shrink-0">
            <div className="card p-4 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <span className="flex items-center gap-1.5 text-sm font-bold text-ink dark:text-slate-100">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
                </span>
                {activeCount > 0 && <button onClick={clearAll} className="text-[11px] text-red-500 font-semibold">Clear ({activeCount})</button>}
              </div>

              <FilterSection title="State">
                <select value={g('state')} onChange={e => set('state', e.target.value)} className="input text-[13px] py-2">
                  <option value="">All states</option>
                  {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </FilterSection>

              <FilterSection title="Category">
                <div className="space-y-0.5">
                  {categories.map(cat => {
                    const active = g('category_id') === String(cat.id);
                    return (
                      <button key={cat.id} onClick={() => set('category_id', active ? '' : String(cat.id))}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] w-full text-left transition-colors ${active ? 'bg-teal/15 text-navy font-bold' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                        <span className="text-[15px]">{CAT_EMOJI[cat.name] || '📋'}</span> {cat.name}
                      </button>
                    );
                  })}
                </div>
              </FilterSection>

              <FilterSection title="Status">
                <div className="space-y-1">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                    const active = g('status') === key;
                    return (
                      <button key={key} onClick={() => set('status', active ? '' : key)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] w-full text-left transition-colors ${active ? 'bg-slate-100 dark:bg-slate-700 font-bold' : 'text-slate-500'}`}>
                        <div className={`w-2 h-2 rounded-full badge ${cfg.tw} !p-0 !w-2 !h-2`} />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </FilterSection>

              <FilterSection title="Sort by">
                <div className="space-y-0.5">
                  {[{ val: 'newest', label: 'Newest first' }, { val: 'popular', label: 'Most upvoted' }, { val: 'severity', label: 'Highest severity' }, { val: 'views', label: 'Most viewed' }].map(opt => (
                    <button key={opt.val} onClick={() => set('sort', opt.val)}
                      className={`px-2.5 py-1.5 rounded-lg text-[13px] w-full text-left transition-colors ${(g('sort') || 'newest') === opt.val ? 'bg-teal/15 text-navy font-bold' : 'text-slate-500'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </FilterSection>
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : problems.length ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {problems.map((p, i) => <ProblemCard key={p.id} problem={p} index={i} />)}
                </div>
                <Pagination page={page} totalPages={pagination.totalPages || 1} onChange={(p) => set('page', String(p))} />
              </>
            ) : (
              <EmptyState emoji="🔍" title="No problems found" description="Try adjusting your filters or search term"
                action={
                  <div className="flex gap-2.5">
                    <button onClick={clearAll} className="btn btn-outline btn-sm">Clear filters</button>
                    <Link to="/report" className="btn btn-navy btn-sm"><TrendingUp className="w-3.5 h-3.5" /> Report new problem</Link>
                  </div>
                } />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
