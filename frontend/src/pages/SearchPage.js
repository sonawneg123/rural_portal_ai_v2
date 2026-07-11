// src/pages/SearchPage.js — Feature 7: Global Search
import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { getError } from '../utils/api';
import { StatusBadge, SeverityBadge, Spinner, EmptyState } from '../components/ui';
import { Search, MapPin, Clock, Filter } from 'lucide-react';
import { timeAgo, CAT_EMOJI } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function SearchPage() {
  const [sp, setSp] = useSearchParams();
  const [query,   setQuery]   = useState(sp.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total,   setTotal]   = useState(0);
  const [category, setCategory] = useState('');
  const [status,  setStatus]  = useState('');
  const [cats, setCats] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => { api.get('/categories').then(r => setCats(r.data.data || [])); }, []);

  useEffect(() => {
    const q = sp.get('q') || '';
    if (q) { setQuery(q); doSearch(q, category, status); }
  }, [sp]);

  const doSearch = async (q, cat = category, st = status) => {
    if (!q?.trim()) { setResults([]); setTotal(0); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ search: q, limit: 20 });
      if (cat) params.append('category_id', cat);
      if (st)  params.append('status',      st);
      const { data } = await api.get(`/problems?${params}`);
      setResults(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  };

  const handleInput = (val) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSp(val ? { q: val } : {});
      doSearch(val);
    }, 350);
  };

  const highlight = (text = '', q = '') => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return <>{text.slice(0, idx)}<mark style={{ background: 'rgba(0,212,178,0.25)', color: 'var(--navy)', borderRadius: 2 }}>{text.slice(idx, idx + q.length)}</mark>{text.slice(idx + q.length)}</>;
  };

  return (
    <div className="page-enter" style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 60 }}>
      {/* Search header */}
      <div style={{ background: 'linear-gradient(135deg, var(--navy), var(--navy-light))', padding: '36px 0 48px' }}>
        <div className="container-md" style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', marginBottom: 20 }}>Search Problems</h1>
          <div style={{ position: 'relative', maxWidth: 580, margin: '0 auto' }}>
            <Search size={18} color="var(--text-60)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}/>
            <input value={query} onChange={e => handleInput(e.target.value)}
              placeholder="Search by title, location, category, or tag…"
              autoFocus
              style={{ width: '100%', padding: '14px 48px', borderRadius: 'var(--r-xl)', border: 'none', fontSize: 15, color: 'var(--text)', outline: 'none', boxSizing: 'border-box', boxShadow: 'var(--shadow-lg)' }}/>
            {loading && <Spinner size={18} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }}/>}
          </div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
            <select value={category} onChange={e => { setCategory(e.target.value); doSearch(query, e.target.value, status); }}
              style={{ padding: '7px 12px', borderRadius: 'var(--r-md)', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 12, outline: 'none', cursor: 'pointer' }}>
              <option value="" style={{ color: '#000' }}>All categories</option>
              {cats.map(c => <option key={c.id} value={c.id} style={{ color: '#000' }}>{CAT_EMOJI[c.name]} {c.name}</option>)}
            </select>
            <select value={status} onChange={e => { setStatus(e.target.value); doSearch(query, category, e.target.value); }}
              style={{ padding: '7px 12px', borderRadius: 'var(--r-md)', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 12, outline: 'none', cursor: 'pointer' }}>
              <option value="" style={{ color: '#000' }}>All statuses</option>
              {['pending','in_review','in_progress','resolved','rejected'].map(s => <option key={s} value={s} style={{ color: '#000' }}>{s.replace('_',' ')}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="container-md" style={{ paddingTop: 28 }}>
        {query && !loading && (
          <div style={{ fontSize: 13, color: 'var(--text-60)', marginBottom: 16 }}>
            {total > 0 ? `${total} result${total !== 1 ? 's' : ''} for "${query}"` : `No results for "${query}"`}
          </div>
        )}

        {!query ? (
          <EmptyState emoji="🔍" title="Start typing to search" description="Search across all reported problems by title, location, or AI-generated tags"/>
        ) : loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32}/></div>
        ) : results.length === 0 ? (
          <EmptyState emoji="😕" title="No results found" description={`No problems match "${query}". Try different keywords or remove filters.`}/>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {results.map((p, i) => (
              <Link key={p.id} to={`/problems/${p.id}`}
                style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', padding: '16px 20px', textDecoration: 'none', display: 'block', boxShadow: 'var(--shadow-xs)', transition: 'all var(--t-spring)', animation: `fadeInUp 0.35s ease ${i * 0.04}s both`, opacity: 0 }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-60)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                      {CAT_EMOJI[p.category]} {p.category}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', lineHeight: 1.35, marginBottom: 6 }}>
                      {highlight(p.title, query)}
                    </div>
                    {p.ai_summary && (
                      <div style={{ fontSize: 12, color: 'var(--text-60)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {highlight(p.ai_summary, query)}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                    <StatusBadge status={p.status}/>
                    {p.ai_severity_score && <SeverityBadge score={p.ai_severity_score}/>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-60)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11}/>{highlight(p.village, query)}, {highlight(p.district, query)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11}/>{timeAgo(p.created_at)}</span>
                </div>
                {p.ai_tags && (
                  <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
                    {p.ai_tags.split(',').slice(0, 4).map((t, j) => {
                      const tag = t.trim();
                      const isMatch = query && tag.toLowerCase().includes(query.toLowerCase());
                      return <span key={j} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--r-full)', background: isMatch ? 'rgba(0,212,178,0.15)' : 'var(--bg-alt)', color: isMatch ? 'var(--teal)' : 'var(--text-60)', border: isMatch ? '1px solid var(--teal)' : 'none' }}>{tag}</span>;
                    })}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
