// src/pages/BookmarksPage.js — Feature 15: Bookmarked problems
import React, { useEffect, useState } from 'react';
import api, { getError } from '../utils/api';
import ProblemCard from '../components/shared/ProblemCard';
import { EmptyState, Spinner } from '../components/ui';
import { Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookmarksPage() {
  const [problems, setProblems] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const ids = JSON.parse(localStorage.getItem('rp_bookmarks') || '[]');
        if (!ids.length) { setLoading(false); return; }
        const results = await Promise.all(
          ids.map(id => api.get(`/problems/${id}`).then(r => r.data.data).catch(() => null))
        );
        setProblems(results.filter(Boolean));
      } catch (err) { toast.error(getError(err)); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div className="page-enter" style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 60 }}>
      <div style={{ background: 'linear-gradient(135deg, var(--navy), var(--navy-light))', padding: '36px 0 52px' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <Bookmark size={24} color="var(--teal)"/>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
              Saved Problems
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
            {problems.length} bookmarked problem{problems.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32}/></div>
        ) : problems.length === 0 ? (
          <EmptyState emoji="🔖" title="No bookmarks yet" description="Save problems you care about by clicking the bookmark icon on any problem card"/>
        ) : (
          <div className="grid-auto">
            {problems.map((p, i) => <ProblemCard key={p.id} problem={p} index={i}/>)}
          </div>
        )}
      </div>
    </div>
  );
}
