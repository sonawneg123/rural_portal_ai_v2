// src/pages/LeaderboardPage.js — Feature 6: Public Leaderboard
import React, { useEffect, useState } from 'react';
import api, { getError } from '../utils/api';
import { Spinner } from '../components/ui';
import { Trophy, TrendingUp, CheckCircle, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LeaderboardPage() {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('districts');

  useEffect(() => {
    api.get('/stats/leaderboard').then(r => setData(r.data)).catch(e => toast.error(getError(e))).finally(() => setLoading(false));
  }, []);

  const medalColors = ['#F59E0B', '#9CA3AF', '#CD7F32'];

  return (
    <div className="page-enter" style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 60 }}>
      <div style={{ background: 'linear-gradient(135deg, #1E1B4B, var(--purple))', padding: '36px 0 52px' }}>
        <div className="container-sm" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12, animation: 'float 3s ease-in-out infinite' }}>🏆</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-0.8px', marginBottom: 8 }}>Resolution Leaderboard</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 24 }}>Districts and villages with highest issue resolution rates</p>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', background: 'rgba(255,255,255,0.08)', borderRadius: 'var(--r-md)', padding: 3, width: 'fit-content', margin: '0 auto' }}>
            {['districts', 'villages', 'categories'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 18px', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, textTransform: 'capitalize', transition: 'all var(--t-fast)', background: tab === t ? 'rgba(255,255,255,0.95)' : 'transparent', color: tab === t ? 'var(--purple)' : 'rgba(255,255,255,0.75)' }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-sm" style={{ marginTop: -20, position: 'relative', zIndex: 2 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32}/></div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
            {(tab === 'districts' ? data?.districts : tab === 'villages' ? data?.villages : data?.categories || []).map((item, i) => {
              const pct = item.total > 0 ? Math.round((item.resolved / item.total) * 100) : 0;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: i < 9 ? '1px solid var(--border)' : 'none', transition: 'background var(--t-fast)', animation: `fadeInUp 0.35s ease ${i * 0.04}s both`, opacity: 0 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-alt)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {/* Rank */}
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', background: i < 3 ? medalColors[i] + '20' : 'var(--bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 15, color: i < 3 ? medalColors[i] : 'var(--text-40)', flexShrink: 0 }}>
                    {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>
                      {item.district || item.village || item.name}
                    </div>
                    <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-60)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><TrendingUp size={11}/>{item.total} total</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={11}/>{item.resolved} resolved</span>
                      {item.state && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11}/>{item.state}</span>}
                    </div>
                  </div>
                  {/* Score */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)' }}>
                      {pct}%
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-40)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>resolved</div>
                    <div style={{ width: 80, height: 5, background: 'var(--border)', borderRadius: 'var(--r-full)', marginTop: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)', borderRadius: 'var(--r-full)', transition: 'width 1s ease' }}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
