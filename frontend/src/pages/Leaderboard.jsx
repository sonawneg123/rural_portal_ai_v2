import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, CheckCircle, MapPin } from 'lucide-react';
import { statsApi } from '../api/problems.js';
import { PageSpinner } from '../components/ui/Spinner.jsx';

const MEDALS = ['🥇', '🥈', '🥉'];
const MEDAL_COLORS = ['#F59E0B', '#9CA3AF', '#CD7F32'];

export default function Leaderboard() {
  const [tab, setTab] = useState('districts');
  const { data, isLoading } = useQuery({ queryKey: ['leaderboard'], queryFn: () => statsApi.getLeaderboard().then(r => r.data) });

  const list = tab === 'districts' ? data?.districts : tab === 'villages' ? data?.villages : data?.categories || [];

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-16">
      <div className="bg-gradient-to-br from-[#1E1B4B] to-purple py-10">
        <div className="container-custom max-w-2xl text-center">
          <div className="text-5xl mb-3 animate-float">🏆</div>
          <h1 className="font-display text-3xl font-extrabold text-white tracking-tight mb-2">Resolution Leaderboard</h1>
          <p className="text-sm text-white/65 mb-6">Districts and villages with highest issue resolution rates</p>
          <div className="flex gap-1 justify-center bg-white/10 rounded-xl p-1 w-fit mx-auto">
            {['districts', 'villages', 'categories'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4.5 py-1.5 rounded-lg text-[13px] font-medium capitalize transition-colors ${tab === t ? 'bg-white text-purple' : 'text-white/75'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-custom max-w-2xl -mt-5 relative z-10">
        {isLoading ? <PageSpinner /> : (
          <div className="card overflow-hidden">
            {(list || []).map((item, i) => {
              const pct = item.total > 0 ? Math.round((item.resolved / item.total) * 100) : 0;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${i < (list.length - 1) ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-extrabold text-[15px] flex-shrink-0"
                    style={{ background: i < 3 ? `${MEDAL_COLORS[i]}20` : '#F1F5F9', color: i < 3 ? MEDAL_COLORS[i] : '#94A3B8' }}>
                    {i < 3 ? MEDALS[i] : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[15px] text-ink dark:text-slate-100 mb-1">{item.district || item.village || item.name}</div>
                    <div className="flex gap-3.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5" />{item.total} total</span>
                      <span className="flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5" />{item.resolved} resolved</span>
                      {item.state && <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{item.state}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`font-display text-xl font-extrabold ${pct >= 70 ? 'text-emerald-500' : pct >= 40 ? 'text-amber-500' : 'text-red-500'}`}>{pct}%</div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">resolved</div>
                    <div className="w-20 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                      <div className={`h-full rounded-full ${pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
