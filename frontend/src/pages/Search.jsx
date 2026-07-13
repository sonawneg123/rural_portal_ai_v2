import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, MapPin, Clock } from 'lucide-react';
import { problemsApi, categoriesApi } from '../api/problems.js';
import { StatusBadge, SeverityBadge } from '../components/ui/Badge.jsx';
import { PageSpinner } from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { timeAgo, CAT_EMOJI } from '../utils/helpers.js';
import { useDebounce } from '../hooks/useAnimations.js';

function highlight(text = '', q = '') {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return <>{text.slice(0, idx)}<mark className="bg-teal/25 text-navy rounded-sm">{text.slice(idx, idx + q.length)}</mark>{text.slice(idx + q.length)}</>;
}

export default function Search() {
  const [sp, setSp] = useSearchParams();
  const [query, setQuery] = useState(sp.get('q') || '');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const debouncedQuery = useDebounce(query, 350);

  useEffect(() => {
    if (debouncedQuery !== sp.get('q')) {
      const p = new URLSearchParams(sp);
      if (debouncedQuery) p.set('q', debouncedQuery); else p.delete('q');
      setSp(p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const { data: catData } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.getAll().then(r => r.data) });
  const cats = catData?.data || [];

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery, category, status],
    queryFn: () => problemsApi.getAll({ search: debouncedQuery, category_id: category, status, limit: 20 }).then(r => r.data),
    enabled: !!debouncedQuery,
  });

  const results = data?.data || [];
  const total   = data?.pagination?.total || 0;

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-16">
      <div className="bg-gradient-to-br from-navy to-navy-light py-9">
        <div className="container-custom max-w-3xl text-center">
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-5">Search Problems</h1>
          <div className="relative max-w-xl mx-auto">
            <SearchIcon className="w-[18px] h-[18px] text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input value={query} onChange={e => setQuery(e.target.value)} autoFocus
              placeholder="Search by title, location, category, or tag…"
              className="w-full py-3.5 pl-12 pr-4 rounded-2xl border-0 text-[15px] text-ink outline-none shadow-lg" />
          </div>
          <div className="flex gap-2 justify-center mt-4 flex-wrap">
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-white/20 bg-white/12 text-white text-xs outline-none cursor-pointer">
              <option value="" className="text-black">All categories</option>
              {cats.map(c => <option key={c.id} value={c.id} className="text-black">{CAT_EMOJI[c.name]} {c.name}</option>)}
            </select>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-white/20 bg-white/12 text-white text-xs outline-none cursor-pointer">
              <option value="" className="text-black">All statuses</option>
              {['pending', 'in_review', 'in_progress', 'resolved', 'rejected'].map(s => <option key={s} value={s} className="text-black">{s.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="container-custom max-w-3xl pt-7">
        {query && !isLoading && (
          <div className="text-[13px] text-slate-400 mb-4">
            {total > 0 ? `${total} result${total !== 1 ? 's' : ''} for "${query}"` : `No results for "${query}"`}
          </div>
        )}

        {!query ? (
          <EmptyState emoji="🔍" title="Start typing to search" description="Search across all reported problems by title, location, or AI-generated tags" />
        ) : isLoading ? (
          <PageSpinner />
        ) : results.length === 0 ? (
          <EmptyState emoji="😕" title="No results found" description={`No problems match "${query}". Try different keywords.`} />
        ) : (
          <div className="space-y-2.5">
            {results.map((p, i) => (
              <Link key={p.id} to={`/problems/${p.id}`}
                className="card p-4 block no-underline hover:-translate-y-0.5 hover:border-teal transition-all duration-200">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">{CAT_EMOJI[p.category]} {p.category}</div>
                    <div className="font-bold text-[15px] text-ink dark:text-slate-100 leading-snug mb-1.5">{highlight(p.title, query)}</div>
                    {p.ai_summary && <div className="text-xs text-slate-500 leading-relaxed line-clamp-2">{highlight(p.ai_summary, query)}</div>}
                  </div>
                  <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
                    <StatusBadge status={p.status} />
                    {p.ai_severity_score && <SeverityBadge score={p.ai_severity_score} />}
                  </div>
                </div>
                <div className="flex gap-3.5 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{highlight(p.village, query)}, {highlight(p.district, query)}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(p.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
